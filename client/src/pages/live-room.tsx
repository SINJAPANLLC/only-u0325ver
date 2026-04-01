import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Heart, Share2, Radio, Send, Users, Tv, RefreshCw,
  PartyPopper, Zap, LogOut, Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Room, RoomEvent, Track } from "livekit-client";

interface LiveChatMessage {
  id: string;
  streamId: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  message: string;
  createdAt: string;
}

interface FloatingHeart {
  id: number;
  x: number;
}

function formatCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function LiveRoom() {
  const params = useParams<{ streamId: string }>();
  const streamId = params.streamId || "";
  const search = useSearch();
  const urlMode = new URLSearchParams(search).get("mode") as "party" | "twoshot" | null;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch stream info
  const { data: stream, isLoading, error } = useQuery<any>({
    queryKey: ["/api/live", streamId, "info"],
    queryFn: () => fetch(`/api/live/${streamId}/info`).then(r => {
      if (!r.ok) throw new Error("Stream not found");
      return r.json();
    }),
    enabled: !!streamId,
    refetchInterval: 10000,
  });

  // User profile (for points)
  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const creatorName = stream?.creatorDisplayName || "クリエイター";
  const title = stream?.title || "LIVE配信中";
  const viewerCount = stream?.viewerCount || 0;
  const thumbnailUrl = stream?.thumbnailUrl;
  const creatorAvatarUrl = stream?.creatorAvatarUrl;
  const isEnded = stream?.status === "ended";
  const partyRate = stream?.partyRatePerMinute ?? 50;
  const twoshotRate = stream?.twoshotRatePerMinute ?? 100;
  const userPoints = userProfile?.points ?? 0;

  // LiveKit state
  const [videoReady, setVideoReady] = useState(false);
  const [lkStatus, setLkStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  const videoRef = useRef<HTMLVideoElement>(null);
  const roomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  // Session state
  const [activeMode, setActiveMode] = useState<"party" | "twoshot" | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chargeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to LiveKit room as viewer/subscriber
  const connectLiveKit = useCallback(async () => {
    if (!streamId || isEnded) return;
    const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;
    if (!livekitUrl) { setLkStatus("failed"); return; }

    try {
      setLkStatus("connecting");
      const res = await fetch(`/api/live/${streamId}/livekit-token?role=viewer`);
      if (!res.ok) throw new Error("Token error");
      const { token } = await res.json();

      const room = new Room({
        adaptiveStream: true,
        dynacast: false,
        reconnectPolicy: {
          nextRetryDelayInMs: (context) => {
            if (context.retryCount <= 3) return 300;
            if (context.retryCount <= 6) return 1000;
            return 3000;
          },
        },
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          setVideoReady(true);
        }
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach() as HTMLAudioElement;
          audioElementsRef.current.push(el);
          document.body.appendChild(el);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Video) { track.detach(); setVideoReady(false); }
        if (track.kind === Track.Kind.Audio) {
          track.detach().forEach(el => { try { document.body.removeChild(el); } catch {} });
        }
      });

      room.on(RoomEvent.Connected, () => {
        setLkStatus("connected");
        room.remoteParticipants.forEach(p => {
          p.trackPublications.forEach(pub => {
            if (!pub.isSubscribed || !pub.track) return;
            if (pub.track.kind === Track.Kind.Video && videoRef.current) {
              pub.track.attach(videoRef.current); setVideoReady(true);
            }
            if (pub.track.kind === Track.Kind.Audio) {
              const el = pub.track.attach() as HTMLAudioElement;
              audioElementsRef.current.push(el);
              document.body.appendChild(el);
            }
          });
        });
      });

      room.on(RoomEvent.Disconnected, () => { setLkStatus("failed"); setVideoReady(false); });
      await room.connect(livekitUrl, token);
    } catch (err) {
      console.error("[LiveKit viewer]", err);
      setLkStatus("failed");
    }
  }, [streamId, isEnded]);

  const disconnectLiveKit = useCallback(async () => {
    audioElementsRef.current.forEach(el => { try { document.body.removeChild(el); } catch {} });
    audioElementsRef.current = [];
    if (roomRef.current) { await roomRef.current.disconnect(); roomRef.current = null; }
    setVideoReady(false); setLkStatus("idle");
  }, []);

  useEffect(() => {
    if (stream && !isEnded && lkStatus === "idle") connectLiveKit();
    if (isEnded) disconnectLiveKit();
  }, [stream?.id, isEnded]);

  useEffect(() => () => { disconnectLiveKit(); }, []);

  // Session timer
  useEffect(() => {
    if (activeMode) {
      sessionTimerRef.current = setInterval(() => setSessionSeconds(s => s + 1), 1000);
    } else {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      setSessionSeconds(0);
    }
    return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
  }, [activeMode]);

  // Point charge every 60 seconds
  useEffect(() => {
    if (!activeMode || !streamId) return;
    chargeTimerRef.current = setInterval(async () => {
      try {
        const res = await apiRequest("POST", `/api/live/${streamId}/charge`);
        const data = await res.json();
        if (data.insufficientPoints) {
          toast({ title: "ポイントが不足したためセッションを終了しました", variant: "destructive" });
          setActiveMode(null);
          queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
          return;
        }
        setSessionPoints(p => p + (data.charged || 0));
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      } catch {}
    }, 60000);
    return () => { if (chargeTimerRef.current) clearInterval(chargeTimerRef.current); };
  }, [activeMode, streamId]);

  // Leave session on unmount if active
  useEffect(() => () => {
    if (activeMode && streamId) {
      apiRequest("POST", `/api/live/${streamId}/leave`).catch(() => {});
    }
  }, []);

  const joinMutation = useMutation({
    mutationFn: (mode: "party" | "twoshot") =>
      apiRequest("POST", `/api/live/${streamId}/join`, { mode }).then(r => r.json()),
    onSuccess: (data, mode) => {
      if (data.insufficientPoints) {
        toast({ title: "ポイントが不足しています。ポイントを購入してください。", variant: "destructive" });
        return;
      }
      if (data.twoshotOccupied) {
        toast({ title: "2ショットは現在他のユーザーが利用中です", variant: "destructive" });
        return;
      }
      setActiveMode(mode);
      setSessionSeconds(0);
      setSessionPoints(0);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: mode === "party" ? "パーティーに参加しました" : "2ショットに参加しました" });
    },
    onError: (e: any) => {
      toast({ title: e?.message || "参加に失敗しました", variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/live/${streamId}/leave`).then(r => r.json()),
    onSuccess: () => {
      setActiveMode(null);
      setSessionSeconds(0);
      setSessionPoints(0);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "セッションを終了しました" });
    },
  });

  // 2ショット申請
  const [twoshotRequestStatus, setTwoshotRequestStatus] = useState<"idle" | "pending" | "accepted" | "declined">("idle");
  const [twoshotRequestId, setTwoshotRequestId] = useState<string | null>(null);

  const requestTwoshotMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/live/${streamId}/request-twoshot`).then(r => r.json()),
    onSuccess: (data) => {
      setTwoshotRequestId(data.id);
      setTwoshotRequestStatus("pending");
      toast({ title: "2ショットを申請しました。クリエイターの承認をお待ちください。" });
    },
    onError: () => toast({ title: "申請に失敗しました", variant: "destructive" }),
  });

  // 申請ステータスをポーリング
  useEffect(() => {
    if (twoshotRequestStatus !== "pending" || !streamId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/live/${streamId}/my-twoshot-request`);
        const data = await res.json();
        if (!data) return;
        if (data.status === "accepted") {
          clearInterval(interval);
          setTwoshotRequestStatus("accepted");
          toast({ title: "2ショットが承認されました！" });
          joinMutation.mutate("twoshot");
        } else if (data.status === "declined") {
          clearInterval(interval);
          setTwoshotRequestStatus("declined");
          toast({ title: "2ショット申請が断られました", variant: "destructive" });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [twoshotRequestStatus, streamId]);

  // Auto-join from URL mode param (set when entering from live list)
  const autoJoinDone = useRef(false);
  useEffect(() => {
    if (autoJoinDone.current) return;
    // Wait until stream, user, AND userProfile are all loaded
    if (!urlMode || !stream || !user || !userProfile || activeMode) return;
    if (urlMode === "twoshot") {
      autoJoinDone.current = true;
      requestTwoshotMutation.mutate();
    } else if (urlMode === "party") {
      if (userPoints < partyRate) {
        autoJoinDone.current = true;
        toast({ title: "ポイント不足", description: `パーティー参加には${partyRate}pt以上必要です`, variant: "destructive" });
        return;
      }
      autoJoinDone.current = true;
      joinMutation.mutate(urlMode);
    } else {
      autoJoinDone.current = true;
      joinMutation.mutate(urlMode);
    }
  }, [urlMode, stream?.id, user?.id, !!userProfile, userPoints, partyRate]);

  // Chat
  const { data: chatData } = useQuery<LiveChatMessage[]>({
    queryKey: ["/api/live", streamId, "chat"],
    queryFn: () => fetch(`/api/live/${streamId}/chat`).then(r => r.json()),
    enabled: !!streamId && !!stream,
    refetchInterval: 3000,
  });

  const [displayedMessages, setDisplayedMessages] = useState<LiveChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (chatData) setDisplayedMessages(chatData); }, [chatData]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [displayedMessages]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => apiRequest("POST", `/api/live/${streamId}/chat`, { message }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/live", streamId, "chat"] }); },
  });

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const heartIdRef = useRef(0);
  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showModePanel, setShowModePanel] = useState(false);

  useEffect(() => {
    if (!streamId || !stream) return;
    apiRequest("POST", `/api/live/${streamId}/viewer`).catch(() => {});
    return () => { apiRequest("DELETE", `/api/live/${streamId}/viewer`).catch(() => {}); };
  }, [streamId, stream?.id]);

  const handleLike = useCallback(() => {
    setLiked(prev => { setLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
    const id = ++heartIdRef.current;
    const x = Math.random() * 40 - 20;
    setFloatingHearts(prev => [...prev, { id, x }]);
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== id)), 1200);
  }, []);

  const sendChat = useCallback(() => {
    const text = inputText.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
    setInputText("");
  }, [inputText, sendMutation]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) { navigator.share({ title, url }).catch(() => {}); }
    else { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }
  }, [title]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">配信を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center">
            <Tv className="h-10 w-10 text-white/40" />
          </div>
          <h2 className="text-white font-bold text-lg">配信が見つかりません</h2>
          <p className="text-white/50 text-sm">この配信は終了したか、存在しません</p>
          <button onClick={() => setLocation("/live")} className="mt-2 bg-pink-500 text-white font-bold px-6 py-2.5 rounded-full text-sm">
            ライブ一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  const currentRate = activeMode === "party" ? partyRate : activeMode === "twoshot" ? twoshotRate : 0;

  // 2ショット申請中の待機画面（ライブ画面への入室をブロック）
  if (urlMode === "twoshot" && twoshotRequestStatus !== "accepted" && activeMode !== "twoshot") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center px-8 text-center">
        {thumbnailUrl ? (
          <div className="absolute inset-0">
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-black/70" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/40 to-black" />
        )}
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
            twoshotRequestStatus === "declined"
              ? "bg-red-500/20 border border-red-500/40"
              : "bg-violet-500/20 border border-violet-500/40"
          }`}>
            {twoshotRequestStatus === "pending" ? (
              <div className="h-8 w-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            ) : twoshotRequestStatus === "declined" ? (
              <LogOut className="h-8 w-8 text-red-400" />
            ) : (
              <Zap className="h-8 w-8 text-violet-400" />
            )}
          </div>
          <div>
            <h2 className="text-white font-bold text-xl mb-1">
              {twoshotRequestStatus === "declined" ? "申請が断られました" : "2ショット申請中"}
            </h2>
            <p className="text-white/60 text-sm">
              {twoshotRequestStatus === "pending"
                ? "クリエイターの承認をお待ちください"
                : twoshotRequestStatus === "declined"
                ? "クリエイターが現在対応できません"
                : "申請を送信しています..."}
            </p>
          </div>
          {stream && (
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
              <div className="h-6 w-6 rounded-full overflow-hidden bg-white/10">
                {stream.creatorAvatar && <img src={stream.creatorAvatar} className="w-full h-full object-cover" />}
              </div>
              <span className="text-white/80 text-xs">{stream.creatorDisplayName || "クリエイター"}</span>
            </div>
          )}
          <button
            onClick={() => setLocation("/live")}
            className="mt-2 text-white/40 text-sm underline underline-offset-2"
            data-testid="button-cancel-twoshot-request"
          >
            キャンセルしてライブ一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Background / Video */}
      <div className="absolute inset-0">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-pink-900/60 to-black" />
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
          onContextMenu={e => e.preventDefault()}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {!isEnded && !videoReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              {lkStatus === "connecting" || lkStatus === "connected" ? (
                <>
                  <div className="h-12 w-12 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/80 text-sm font-medium">配信者の映像を待っています...</p>
                </>
              ) : lkStatus === "failed" ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-black/40 flex items-center justify-center">
                    <Radio className="h-8 w-8 text-pink-400 animate-pulse" />
                  </div>
                  <p className="text-white font-bold text-lg">配信接続中...</p>
                  <button
                    onClick={() => { setLkStatus("idle"); connectLiveKit(); }}
                    className="flex items-center gap-2 mt-1 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full"
                  >
                    <RefreshCw className="h-4 w-4" />再接続する
                  </button>
                </>
              ) : (
                <div className="h-12 w-12 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        )}

        {isEnded && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                <Tv className="h-8 w-8 text-white/50" />
              </div>
              <p className="text-white font-bold text-lg">配信が終了しました</p>
              <button onClick={() => setLocation("/live")} className="mt-1 bg-pink-500 text-white font-bold px-5 py-2 rounded-full text-sm">
                ライブ一覧へ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe pt-3 pb-2">
        <button
          onClick={() => setLocation("/live")}
          className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
          data-testid="button-back-live"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <button
          onClick={() => setLocation(`/creator/${stream.creatorId}`)}
          className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5"
          data-testid="button-creator-profile"
        >
          <Avatar className="h-7 w-7 ring-1 ring-white/50">
            <AvatarImage src={creatorAvatarUrl} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs font-bold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-bold">{creatorName}</span>
          {!isEnded && (
            <div className="flex items-center gap-1 bg-red-500 rounded-full px-2 py-0.5">
              <Radio className="h-2.5 w-2.5 text-white animate-pulse" />
              <span className="text-white text-[10px] font-bold">LIVE</span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
            <Users className="h-3.5 w-3.5 text-white/70" />
            <span className="text-white text-xs font-bold">{formatCount(viewerCount)}</span>
          </div>
          {user && (
            <div className="flex items-center gap-1 bg-pink-500/30 backdrop-blur-md rounded-full px-3 py-1.5">
              <span className="text-white text-xs font-bold">{userPoints.toLocaleString()}pt</span>
            </div>
          )}
        </div>
      </div>

      {/* Stream title */}
      <div className="relative z-10 px-4 mt-1">
        <p className="text-white/90 text-xs drop-shadow line-clamp-1">{title}</p>
      </div>

      {/* Active session banner */}
      {activeMode && (
        <div className="relative z-10 mx-4 mt-2">
          <div className={`rounded-2xl px-4 py-2.5 flex items-center justify-between ${
            activeMode === "twoshot" ? "bg-purple-500/70 backdrop-blur-md" : "bg-pink-500/70 backdrop-blur-md"
          }`}>
            <div className="flex items-center gap-2">
              {activeMode === "party"
                ? <PartyPopper className="h-4 w-4 text-white" />
                : <Zap className="h-4 w-4 text-white" />
              }
              <div>
                <p className="text-white text-xs font-bold">
                  {activeMode === "party" ? "パーティー中" : "2ショット中"}
                </p>
                <div className="flex items-center gap-2 text-white/80 text-[10px]">
                  <Clock className="h-3 w-3" />{formatTime(sessionSeconds)}
                  {sessionPoints}pt 消費
                  <span>({currentRate}pt/分)</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="h-8 px-3 rounded-full bg-white/20 flex items-center gap-1 text-white text-xs font-medium"
            >
              <LogOut className="h-3 w-3" />退出
            </button>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="relative z-10 flex-1" />

      {/* Chat messages */}
      <div className="relative z-10 flex items-end gap-2 px-3 pb-2">
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1.5" style={{ maxHeight: "25vh" }}>
          {displayedMessages.length === 0 && !isEnded && (
            <p className="text-white/30 text-xs text-center py-4">まだコメントはありません</p>
          )}
          {displayedMessages.map(msg => (
            <div key={msg.id} className="flex items-start gap-2">
              <div className="flex items-baseline gap-1.5 bg-black/40 backdrop-blur-sm rounded-2xl px-3 py-1.5 max-w-full">
                {msg.avatarUrl && <img src={msg.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover flex-shrink-0" />}
                <span className="text-pink-300 text-xs font-bold whitespace-nowrap">{msg.displayName}</span>
                <span className="text-white text-xs break-words">{msg.message}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 pb-1 flex-shrink-0">
          {/* Like */}
          <div className="flex flex-col items-center gap-1 relative">
            <AnimatePresence>
              {floatingHearts.map(h => (
                <motion.div
                  key={h.id}
                  className="absolute bottom-12 pointer-events-none"
                  style={{ left: `calc(50% + ${h.x}px)` }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -80, opacity: 0, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                >
                  <Heart className="h-5 w-5 text-pink-400 fill-pink-400" />
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.button whileTap={{ scale: 1.25 }} onClick={handleLike}
              className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg"
              data-testid="button-like-liveroom">
              <Heart className={`h-6 w-6 transition-colors drop-shadow ${liked ? "text-pink-400 fill-pink-400" : "text-white"}`} />
            </motion.button>
            <span className="text-white text-[10px] font-bold drop-shadow">{formatCount(likeCount)}</span>
          </div>

          {/* Party/Twoshot toggle */}
          {!isEnded && user && (
            <div className="flex flex-col items-center gap-1">
              <motion.button whileTap={{ scale: 1.15 }} onClick={() => setShowModePanel(p => !p)}
                className={`h-11 w-11 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg ${
                  activeMode ? "bg-pink-500/80" : "bg-black/40"
                }`}
                data-testid="button-mode-panel">
                <PartyPopper className="h-5 w-5 text-white" />
              </motion.button>
              <span className="text-white/60 text-[10px]">参加</span>
            </div>
          )}

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <motion.button whileTap={{ scale: 1.15 }} onClick={handleShare}
              className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg"
              data-testid="button-share-liveroom">
              <Share2 className="h-5 w-5 text-white/80" />
            </motion.button>
            <span className="text-white/60 text-[10px]">{copied ? "コピー済" : "シェア"}</span>
          </div>
        </div>
      </div>

      {/* Mode selection panel */}
      <AnimatePresence>
        {showModePanel && !isEnded && (
          <motion.div
            className="relative z-10 mx-3 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              {/* Points balance */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/60 text-xs">保有ポイント</p>
                <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-2.5 py-1">
                  <span className="text-yellow-300 text-sm font-bold">{userPoints.toLocaleString()}pt</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Party button */}
                <button
                  onClick={() => { joinMutation.mutate("party"); setShowModePanel(false); }}
                  disabled={joinMutation.isPending || activeMode === "party" || userPoints < partyRate}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    activeMode === "party"
                      ? "bg-pink-500/40 border-pink-400 cursor-default"
                      : userPoints < partyRate
                      ? "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                      : "bg-pink-500/20 border-pink-500/40 active:scale-95"
                  }`}
                  data-testid="button-join-party"
                >
                  <PartyPopper className="h-6 w-6 text-pink-300" />
                  <div className="text-center">
                    <p className="text-white text-xs font-bold">パーティー</p>
                    <p className="text-pink-300 text-[10px]">{partyRate}pt / 分</p>
                    {activeMode === "party" && <p className="text-green-400 text-[10px] mt-0.5">参加中</p>}
                    {userPoints < partyRate && <p className="text-red-400 text-[10px] mt-0.5">PT不足</p>}
                  </div>
                </button>

                {/* 2shot button - 申請制 */}
                <button
                  onClick={() => {
                    if (activeMode === "twoshot") return;
                    if (twoshotRequestStatus === "pending") return;
                    requestTwoshotMutation.mutate();
                    setShowModePanel(false);
                  }}
                  disabled={requestTwoshotMutation.isPending || activeMode === "twoshot" || userPoints < twoshotRate || twoshotRequestStatus === "pending"}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    activeMode === "twoshot"
                      ? "bg-purple-500/40 border-purple-400 cursor-default"
                      : twoshotRequestStatus === "pending"
                      ? "bg-yellow-500/20 border-yellow-500/40 cursor-default"
                      : userPoints < twoshotRate
                      ? "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                      : "bg-purple-500/20 border-purple-500/40 active:scale-95"
                  }`}
                  data-testid="button-join-twoshot"
                >
                  <Zap className="h-6 w-6 text-purple-300" />
                  <div className="text-center">
                    <p className="text-white text-xs font-bold">2ショット</p>
                    <p className="text-purple-300 text-[10px]">{twoshotRate}pt / 分</p>
                    {activeMode === "twoshot" && <p className="text-green-400 text-[10px] mt-0.5">参加中</p>}
                    {twoshotRequestStatus === "pending" && <p className="text-yellow-300 text-[10px] mt-0.5">申請中...</p>}
                    {twoshotRequestStatus === "declined" && <p className="text-red-400 text-[10px] mt-0.5">再申請する</p>}
                    {userPoints < twoshotRate && twoshotRequestStatus === "idle" && <p className="text-red-400 text-[10px] mt-0.5">PT不足</p>}
                    {activeMode !== "twoshot" && twoshotRequestStatus === "idle" && userPoints >= twoshotRate && <p className="text-purple-300 text-[10px] mt-0.5">タップで申請</p>}
                  </div>
                </button>
              </div>

              {userPoints < partyRate && (
                <button
                  onClick={() => { setShowModePanel(false); setLocation("/points-purchase"); }}
                  className="mt-3 w-full py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-medium"
                >
                  ポイントを購入する →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat input */}
      <div className="relative z-10 px-3 pb-safe pb-5 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md rounded-full px-4 h-10 gap-2 border border-white/20">
          <input
            className="flex-1 bg-transparent text-white text-sm placeholder-white/40 outline-none"
            placeholder="コメントする…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
            data-testid="input-chat"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={sendChat}
          disabled={!inputText.trim() || sendMutation.isPending}
          className="h-10 w-10 rounded-full bg-pink-500 disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          data-testid="button-send-chat"
        >
          <Send className="h-4 w-4 text-white" />
        </motion.button>
      </div>
    </div>
  );
}
