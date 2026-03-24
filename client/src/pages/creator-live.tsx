import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Radio,
  Users,
  Clock,
  Trash2,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RotateCcw,
  Share2,
  ChevronLeft,
  Copy,
  Check,
  Send,
  Coins,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LiveStream, UserProfile } from "@shared/schema";

type ViewMode = "list" | "streaming";

// Minimal WHIP client using backend proxy
async function startWhipStream(
  streamId: string,
  stream: MediaStream,
  signal: AbortSignal
): Promise<RTCPeerConnection | null> {
  console.log("[WHIP] Starting, tracks:", stream.getTracks().map(t => t.kind + ":" + t.enabled));

  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
    ],
  });

  stream.getTracks().forEach((t) => pc.addTrack(t, stream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log("[WHIP] Offer created, ICE gathering state:", pc.iceGatheringState);

  // Wait for ICE gathering (max 5 seconds)
  await new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") { resolve(); return; }
    const timer = setTimeout(() => { console.log("[WHIP] ICE timeout, proceeding"); resolve(); }, 5000);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete") { clearTimeout(timer); resolve(); }
    });
    pc.addEventListener("icecandidate", (e) => {
      if (!e.candidate) { clearTimeout(timer); resolve(); }
    });
  });

  const sdp = pc.localDescription?.sdp;
  if (!sdp) {
    pc.close();
    throw new Error("SDP is null after ICE gathering");
  }
  console.log("[WHIP] Sending SDP to proxy, length:", sdp.length);

  let res: Response;
  try {
    res = await fetch(`/api/live/${streamId}/whip`, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: sdp,
      signal,
    });
  } catch (fetchErr: any) {
    pc.close();
    throw new Error(`Fetch error: ${fetchErr?.message || fetchErr}`);
  }

  console.log("[WHIP] Proxy response:", res.status);
  if (!res.ok) {
    const txt = await res.text();
    pc.close();
    throw new Error(`WHIP ${res.status}: ${txt}`);
  }

  const answerSdp = await res.text();
  console.log("[WHIP] Got answer SDP, length:", answerSdp.length);
  if (answerSdp.trim()) {
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    console.log("[WHIP] Remote description set");
  }

  return pc;
}

export default function CreatorLive() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Camera state
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Stream state
  const [streamDuration, setStreamDuration] = useState(0);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState("");
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRtmpInfo, setShowRtmpInfo] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [partyPointsPerMinute, setPartyPointsPerMinute] = useState(50);
  const [twoshotPointsPerMinute, setTwoshotPointsPerMinute] = useState(100);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [whipStatus, setWhipStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");

  // Streaming credentials
  const [rtmpServerUrl, setRtmpServerUrl] = useState<string | null>(null);
  const [rtmpStreamKey, setRtmpStreamKey] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const whipAbortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: myLiveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/my-live"],
  });

  const { data: liveChatMessages } = useQuery<any[]>({
    queryKey: ["/api/live", currentStreamId, "chat"],
    queryFn: () => fetch(`/api/live/${currentStreamId}/chat`).then((r) => r.json()),
    enabled: !!currentStreamId && viewMode === "streaming",
    refetchInterval: 3000,
  });

  const { data: streamStatus } = useQuery<{
    activeSessionCount: number;
    hasParty: boolean;
    hasTwoshot: boolean;
  }>({
    queryKey: ["/api/live", currentStreamId, "status"],
    queryFn: async () => {
      const res = await fetch(`/api/live/${currentStreamId}/status`);
      return res.json();
    },
    refetchInterval: 5000,
    enabled: !!currentStreamId && viewMode === "streaming",
  });

  // Camera setup
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      media.getVideoTracks().forEach((t) => { t.enabled = isCameraOn; });
      media.getAudioTracks().forEach((t) => { t.enabled = isMicOn; });
      streamRef.current = media;
      if (videoRef.current) videoRef.current.srcObject = media;
      return media;
    } catch {
      toast({ title: "カメラへのアクセスに失敗しました", variant: "destructive" });
      return null;
    }
  }, [facingMode, isCameraOn, isMicOn, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const connectWhip = useCallback(async (streamId: string) => {
    if (!streamRef.current) return;
    try {
      setWhipStatus("connecting");
      whipAbortRef.current = new AbortController();
      const pc = await startWhipStream(streamId, streamRef.current, whipAbortRef.current.signal);
      pcRef.current = pc;
      if (pc) {
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setWhipStatus("connected");
          else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) setWhipStatus("failed");
        };
        setWhipStatus("connected");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("WHIP failed:", err?.message || err?.name || String(err), err);
        setWhipStatus("failed");
        setShowRtmpInfo(true);
      }
    }
  }, []);

  const disconnectWhip = useCallback(() => {
    whipAbortRef.current?.abort();
    pcRef.current?.close();
    pcRef.current = null;
    setWhipStatus("idle");
  }, []);

  // Start camera + connect WHIP when entering streaming mode
  useEffect(() => {
    if (viewMode === "streaming" && currentStreamId) {
      startCamera().then((media) => {
        if (media) connectWhip(currentStreamId);
      });
    } else if (viewMode !== "streaming") {
      disconnectWhip();
      stopCamera();
    }
  }, [viewMode, currentStreamId]);

  // Re-init camera on facingMode change (don't reconnect WHIP - it's already connected)
  useEffect(() => {
    if (viewMode === "streaming") {
      startCamera().then((media) => {
        // Update WHIP tracks if already connected
        if (media && pcRef.current) {
          const senders = pcRef.current.getSenders();
          media.getTracks().forEach((track) => {
            const sender = senders.find((s) => s.track?.kind === track.kind);
            if (sender) sender.replaceTrack(track).catch(() => {});
          });
        }
      });
    }
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      disconnectWhip();
      stopCamera();
    },
    []
  );

  // Timer
  useEffect(() => {
    if (viewMode === "streaming") {
      timerRef.current = setInterval(() => setStreamDuration((p) => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setStreamDuration(0);
      setEarnedPoints(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [viewMode]);

  // Heartbeat
  useEffect(() => {
    if (!currentStreamId || viewMode !== "streaming") return;
    const send = () => apiRequest("POST", `/api/live/${currentStreamId}/heartbeat`).catch(console.error);
    send();
    const t = setInterval(send, 10000);
    return () => clearInterval(t);
  }, [currentStreamId, viewMode]);

  const startLiveMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/live", {
        title,
        description: "",
        status: "live",
        partyRatePerMinute: partyPointsPerMinute,
        twoshotRatePerMinute: twoshotPointsPerMinute,
      });
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setCurrentStreamId(data.id);
      if (data.rtmpServerUrl) setRtmpServerUrl(data.rtmpServerUrl);
      if (data.rtmpStreamKey) setRtmpStreamKey(data.rtmpStreamKey);
      setViewMode("streaming");
      setWhipStatus("idle");
    },
    onError: (error: any) => {
      toast({ title: error?.message || "配信の開始に失敗しました", variant: "destructive" });
    },
  });

  const endLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/live/${id}`, { status: "ended" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setViewMode("list");
      setCurrentStreamId(null);
      setRtmpServerUrl(null);
      setRtmpStreamKey(null);
      toast({ title: "配信を終了しました" });
    },
    onError: () => toast({ title: "配信終了に失敗しました", variant: "destructive" }),
  });

  const deleteLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/live/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      toast({ title: "削除しました" });
    },
  });

  const handleStartLive = () => {
    if (!streamTitle.trim()) {
      toast({ title: "タイトルを入力してください", variant: "destructive" });
      return;
    }
    setIsTitleDialogOpen(false);
    startLiveMutation.mutate(streamTitle);
  };

  const copyText = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentStreamId) return;
    try {
      await apiRequest("POST", `/api/live/${currentStreamId}/chat`, { message: commentText.trim() });
      setCommentText("");
    } catch {}
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const displayName = profile?.displayName || user?.firstName || "クリエイター";
  const pastStreams = myLiveStreams?.filter((s) => s.status !== "live") || [];

  // ─── STREAMING VIEW ───────────────────────────────────────────────────────
  if (viewMode === "streaming") {
    return (
      <div className="absolute inset-0 bg-black flex flex-col overflow-hidden" style={{ zIndex: 9999 }}>
        {/* Camera */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${
            facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
        />
        {!isCameraOn && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <CameraOff className="h-20 w-20 text-white/20" />
          </div>
        )}

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-500 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
            <div className="bg-black/50 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-white/70" />
              <span className="text-white text-xs">{formatDuration(streamDuration)}</span>
            </div>
            <div className="bg-black/50 backdrop-blur rounded-full px-2.5 py-1 flex items-center gap-1">
              <Users className="h-3 w-3 text-white/70" />
              <span className="text-white text-xs">{streamStatus?.activeSessionCount || 0}</span>
            </div>
            {/* Connection status */}
            <div className={`rounded-full px-2.5 py-1 flex items-center gap-1 ${
              whipStatus === "connected"
                ? "bg-green-500/30"
                : whipStatus === "connecting"
                ? "bg-yellow-500/30"
                : whipStatus === "failed"
                ? "bg-red-500/30"
                : "bg-black/50"
            }`}>
              {whipStatus === "connected" ? (
                <><Wifi className="h-3 w-3 text-green-400" /><span className="text-green-400 text-xs">配信中</span></>
              ) : whipStatus === "connecting" ? (
                <><div className="animate-spin h-3 w-3 border border-yellow-400 border-t-transparent rounded-full" /><span className="text-yellow-400 text-xs">接続中</span></>
              ) : whipStatus === "failed" ? (
                <><WifiOff className="h-3 w-3 text-red-400" /><span className="text-red-400 text-xs">未接続</span></>
              ) : null}
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-full"
            onClick={() => currentStreamId && endLiveMutation.mutate(currentStreamId)}
            disabled={endLiveMutation.isPending}
            data-testid="button-end-stream"
          >
            {endLiveMutation.isPending ? "終了中..." : "終了"}
          </Button>
        </div>

        {/* Camera controls */}
        <div className="relative z-10 flex items-center justify-center gap-3 mt-1">
          <button
            onClick={() => {
              if (streamRef.current) streamRef.current.getVideoTracks().forEach((t) => { t.enabled = !isCameraOn; });
              setIsCameraOn((p) => !p);
            }}
            className={`h-11 w-11 rounded-full flex items-center justify-center ${
              isCameraOn ? "bg-white/20" : "bg-red-500/60"
            }`}
            data-testid="button-toggle-camera"
          >
            {isCameraOn ? <Camera className="h-5 w-5 text-white" /> : <CameraOff className="h-5 w-5 text-white" />}
          </button>
          <button
            onClick={() => {
              if (streamRef.current) streamRef.current.getAudioTracks().forEach((t) => { t.enabled = !isMicOn; });
              setIsMicOn((p) => !p);
            }}
            className={`h-11 w-11 rounded-full flex items-center justify-center ${
              isMicOn ? "bg-white/20" : "bg-red-500/60"
            }`}
            data-testid="button-toggle-mic"
          >
            {isMicOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}
          </button>
          <button
            onClick={() => setFacingMode((p) => (p === "user" ? "environment" : "user"))}
            className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center"
            data-testid="button-switch-camera"
          >
            <RotateCcw className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setIsShareOpen(true)}
            className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center"
            data-testid="button-share"
          >
            <Share2 className="h-5 w-5 text-white" />
          </button>
          {/* Reconnect button if WHIP failed */}
          {whipStatus === "failed" && currentStreamId && (
            <button
              onClick={() => { setWhipStatus("idle"); connectWhip(currentStreamId); }}
              className="h-11 px-3 rounded-full bg-yellow-500/60 flex items-center justify-center"
            >
              <span className="text-white text-xs font-medium">再接続</span>
            </button>
          )}
        </div>

        {/* Stats + RTMP info (optional, collapsed) */}
        <div className="relative z-10 px-4 mt-2">
          <div className="flex items-center gap-2 justify-center">
            <div className="bg-black/40 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-white text-xs">{earnedPoints.toLocaleString()}pt</span>
            </div>
            {rtmpStreamKey && (
              <button
                onClick={() => setShowRtmpInfo((p) => !p)}
                className="bg-black/40 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-1.5"
              >
                <span className="text-white/60 text-xs">OBS接続情報</span>
                {showRtmpInfo ? <ChevronUp className="h-3 w-3 text-white/60" /> : <ChevronDown className="h-3 w-3 text-white/60" />}
              </button>
            )}
          </div>
          {showRtmpInfo && rtmpStreamKey && (
            <div className="mt-2 bg-black/60 backdrop-blur rounded-xl border border-white/10 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs w-16 flex-shrink-0">サーバー</span>
                <span className="text-white/80 text-xs font-mono flex-1 truncate">{rtmpServerUrl}</span>
                <button onClick={() => copyText(rtmpServerUrl!, "srv")} className="text-white/40">
                  {copiedField === "srv" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs w-16 flex-shrink-0">キー</span>
                <span className="text-white/80 text-xs font-mono flex-1 truncate">
                  {showStreamKey ? rtmpStreamKey : "•".repeat(Math.min(rtmpStreamKey.length, 20))}
                </span>
                <button onClick={() => setShowStreamKey((p) => !p)} className="text-white/40">
                  {showStreamKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => copyText(rtmpStreamKey, "key")} className="text-white/40">
                  {copiedField === "key" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Chat overlay */}
        <div className="relative z-10 flex-1 flex flex-col justify-end px-3 pb-3">
          <div className="max-h-44 overflow-y-auto space-y-1.5 mb-2 scrollbar-hide">
            {(liveChatMessages || []).slice(-15).map((msg: any) => (
              <div key={msg.id} className="flex items-start gap-2">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={msg.avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-pink-500 text-white text-[10px]">
                    {msg.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-black/50 backdrop-blur rounded-xl px-2.5 py-1.5 max-w-[80%]">
                  <span className="text-pink-300 text-[10px] font-bold">{msg.displayName} </span>
                  <span className="text-white/90 text-xs">{msg.message}</span>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendComment} className="flex items-center gap-2">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="コメントを入力..."
              className="flex-1 bg-black/50 border-white/20 text-white placeholder:text-white/40 rounded-full text-sm"
              data-testid="input-comment"
            />
            <Button
              type="submit"
              size="icon"
              className="bg-pink-500 hover:bg-pink-600 rounded-full h-9 w-9 flex-shrink-0"
              disabled={!commentText.trim()}
              data-testid="button-send-comment"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Share Sheet */}
        <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
          <SheetContent side="bottom" className="h-52 rounded-t-3xl" style={{ zIndex: 10000 }}>
            <SheetHeader className="pb-4">
              <SheetTitle>ライブをシェア</SheetTitle>
            </SheetHeader>
            <div className="flex items-center justify-around">
              {[
                {
                  label: "リンクをコピー",
                  bg: "bg-gray-700",
                  icon: <Copy className="h-6 w-6 text-white" />,
                  action: async () => {
                    await navigator.clipboard.writeText(`${window.location.origin}/live/${currentStreamId}`);
                    toast({ title: "コピーしました" });
                    setIsShareOpen(false);
                  },
                },
                {
                  label: "Twitter/X",
                  bg: "bg-black",
                  icon: (
                    <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                  action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + "/live/" + currentStreamId)}`, "_blank"),
                },
                {
                  label: "LINE",
                  bg: "bg-[#00B900]",
                  icon: <span className="text-white text-xl font-bold">L</span>,
                  action: () => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.origin + "/live/" + currentStreamId)}`, "_blank"),
                },
              ].map(({ label, bg, icon, action }) => (
                <button key={label} onClick={action} className="flex flex-col items-center gap-2">
                  <div className={`h-14 w-14 rounded-full ${bg} flex items-center justify-center`}>{icon}</div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="h-full bg-background overflow-y-auto scrollbar-hide"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <Button size="icon" variant="ghost" onClick={() => setLocation("/account")} data-testid="button-back">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold">ライブ配信</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Start card */}
        <div className="p-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-2xl text-center border border-pink-500/30">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
            <Radio className="h-10 w-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-1">ライブ配信を開始</h3>
          <p className="text-sm text-muted-foreground mb-5">
            ブラウザのカメラで今すぐ配信できます
          </p>
          <Button
            size="lg"
            onClick={() => setIsTitleDialogOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 w-full"
            disabled={startLiveMutation.isPending}
            data-testid="button-start-live"
          >
            {startLiveMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>準備中...</span>
              </div>
            ) : (
              <><Radio className="h-5 w-5 mr-2" />配信を開始する</>
            )}
          </Button>
        </div>

        {/* Past streams */}
        <div>
          <h2 className="font-semibold mb-3 text-sm text-muted-foreground">配信履歴</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pastStreams.length > 0 ? (
            <div className="space-y-2">
              {pastStreams.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50"
                  data-testid={`stream-item-${s.id}`}
                >
                  <div className="w-12 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    {s.thumbnailUrl ? (
                      <img src={s.thumbnailUrl} className="w-full h-full object-cover rounded-lg" alt="" />
                    ) : (
                      <Radio className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">終了</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />{s.viewerCount || 0}人
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive"
                    onClick={() => deleteLiveMutation.mutate(s.id)}
                    data-testid={`button-delete-${s.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">配信履歴はありません</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-24" />

      {/* Title Dialog */}
      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent className="w-[90vw] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>配信タイトルを設定</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="stream-title">タイトル</Label>
              <Input
                id="stream-title"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="今日のライブ配信"
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleStartLive()}
                data-testid="input-stream-title"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">パーティーレート（/分）</Label>
                <Input
                  type="number"
                  value={partyPointsPerMinute}
                  onChange={(e) => setPartyPointsPerMinute(Number(e.target.value))}
                  className="mt-1"
                  min={0}
                  data-testid="input-party-rate"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">2ショットレート（/分）</Label>
                <Input
                  type="number"
                  value={twoshotPointsPerMinute}
                  onChange={(e) => setTwoshotPointsPerMinute(Number(e.target.value))}
                  className="mt-1"
                  min={0}
                  data-testid="input-twoshot-rate"
                />
              </div>
            </div>
            <Button
              onClick={handleStartLive}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
              disabled={!streamTitle.trim() || startLiveMutation.isPending}
              data-testid="button-confirm-start"
            >
              {startLiveMutation.isPending ? "準備中..." : "配信開始"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
