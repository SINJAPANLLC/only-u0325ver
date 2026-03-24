import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Share2, Radio, Send, Users, Tv, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Hls from "hls.js";

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

export default function LiveRoom() {
  const params = useParams<{ streamId: string }>();
  const streamId = params.streamId || "";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

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

  const creatorName = stream?.creatorDisplayName || "クリエイター";
  const title = stream?.title || "LIVE配信中";
  const viewerCount = stream?.viewerCount || 0;
  const thumbnailUrl = stream?.thumbnailUrl;
  const bunnyPlaybackUrl = stream?.bunnyPlaybackUrl;
  const creatorAvatarUrl = stream?.creatorAvatarUrl;
  const isEnded = stream?.status === "ended";

  // HLS readiness state
  const [hlsReady, setHlsReady] = useState(false);

  // HLS playback (Bunny)
  const hlsVideoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = hlsVideoRef.current;
    if (!video || !bunnyPlaybackUrl) return;
    setHlsReady(false);
    if (bunnyPlaybackUrl.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(bunnyPlaybackUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.muted = false;
        video.play().catch(() => {});
        setHlsReady(true);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setHlsReady(false);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = bunnyPlaybackUrl;
      video.play().catch(() => {});
      setHlsReady(true);
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; setHlsReady(false); };
  }, [bunnyPlaybackUrl]);

  // Fetch chat messages with polling
  const { data: chatData } = useQuery<LiveChatMessage[]>({
    queryKey: ["/api/live", streamId, "chat"],
    queryFn: () => fetch(`/api/live/${streamId}/chat`).then(r => r.json()),
    enabled: !!streamId && !!stream,
    refetchInterval: 3000,
  });

  const [displayedMessages, setDisplayedMessages] = useState<LiveChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatData) setDisplayedMessages(chatData);
  }, [chatData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages]);

  // Post chat message
  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      apiRequest("POST", `/api/live/${streamId}/chat`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live", streamId, "chat"] });
    },
  });

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const heartIdRef = useRef(0);
  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);

  // Increment viewer count on mount, decrement on unmount
  useEffect(() => {
    if (!streamId || !stream) return;
    apiRequest("POST", `/api/live/${streamId}/viewer`).catch(() => {});
    return () => {
      apiRequest("DELETE", `/api/live/${streamId}/viewer`).catch(() => {});
    };
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
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
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
          <button
            onClick={() => setLocation("/live")}
            className="mt-2 bg-pink-500 text-white font-bold px-6 py-2.5 rounded-full text-sm"
          >
            ライブ一覧へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Background / Video */}
      <div className="absolute inset-0">
        {/* Background: thumbnail or gradient */}
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-pink-900/60 to-black" />
        )}

        {/* Bunny HLS video player */}
        <video
          ref={hlsVideoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hlsReady ? "opacity-100" : "opacity-0"}`}
          playsInline
          poster={thumbnailUrl}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* No Bunny channel: live but no HLS playback URL */}
        {!isEnded && !bunnyPlaybackUrl && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4 text-center px-6">
              <div className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                <Radio className="h-8 w-8 text-pink-400 animate-pulse" />
              </div>
              <p className="text-white font-bold text-lg">配信準備中</p>
              <p className="text-white/60 text-sm">配信チャンネルが設定されるまでお待ちください</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/live", streamId, "info"] })}
                className="flex items-center gap-2 mt-1 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                更新する
              </button>
            </div>
          </div>
        )}

        {/* Waiting overlay: when live but HLS stream not yet ready */}
        {!isEnded && bunnyPlaybackUrl && !hlsReady && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/70 text-sm font-medium">配信を読み込み中...</p>
            </div>
          </div>
        )}

        {/* Ended overlay */}
        {isEnded && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                <Tv className="h-8 w-8 text-white/50" />
              </div>
              <p className="text-white font-bold text-lg">配信が終了しました</p>
              <button
                onClick={() => setLocation("/live")}
                className="mt-1 bg-pink-500 text-white font-bold px-5 py-2 rounded-full text-sm"
              >
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

        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
          <Users className="h-3.5 w-3.5 text-white/70" />
          <span className="text-white text-xs font-bold">{formatCount(viewerCount)}</span>
        </div>
      </div>

      {/* Stream title */}
      <div className="relative z-10 px-4 mt-1">
        <p className="text-white/90 text-xs drop-shadow line-clamp-1">{title}</p>
      </div>

      {/* Spacer */}
      <div className="relative z-10 flex-1" />

      {/* Chat messages */}
      <div className="relative z-10 flex items-end gap-2 px-3 pb-2">
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1.5" style={{ maxHeight: "30vh" }}>
          {displayedMessages.length === 0 && !isEnded && (
            <p className="text-white/30 text-xs text-center py-4">まだコメントはありません</p>
          )}
          {displayedMessages.map(msg => (
            <div key={msg.id} className="flex items-start gap-2">
              <div className="flex items-baseline gap-1.5 bg-black/40 backdrop-blur-sm rounded-2xl px-3 py-1.5 max-w-full">
                {msg.avatarUrl && (
                  <img src={msg.avatarUrl} alt="" className="h-4 w-4 rounded-full object-cover flex-shrink-0" />
                )}
                <span className="text-pink-300 text-xs font-bold whitespace-nowrap">{msg.displayName}</span>
                <span className="text-white text-xs break-words">{msg.message}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-4 pb-1 flex-shrink-0">
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
            <motion.button
              whileTap={{ scale: 1.25 }}
              onClick={handleLike}
              className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg"
              data-testid="button-like-liveroom"
            >
              <Heart className={`h-6 w-6 transition-colors drop-shadow ${liked ? "text-pink-400 fill-pink-400" : "text-white"}`} />
            </motion.button>
            <span className="text-white text-[10px] font-bold drop-shadow">{formatCount(likeCount)}</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 1.15 }}
              onClick={handleShare}
              className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg"
              data-testid="button-share-liveroom"
            >
              <Share2 className="h-5 w-5 text-white/80" />
            </motion.button>
            <span className="text-white/60 text-[10px]">{copied ? "コピー済" : "シェア"}</span>
          </div>
        </div>
      </div>

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
