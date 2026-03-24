import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Twitter,
  Facebook,
  MessageCircle,
  Check,
  Send,
  Coins,
  Eye,
  EyeOff,
  MonitorPlay,
  BookOpen,
  Signal,
  Wifi,
  Smartphone,
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
import { useWHIP } from "@/hooks/use-whip";
import type { LiveStream, UserProfile } from "@shared/schema";

type ViewMode = "list" | "streaming";
type StreamingTab = "camera" | "obs";

export default function CreatorLive() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [streamingTab, setStreamingTab] = useState<StreamingTab>("camera");

  // Camera state
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Stream state
  const [streamDuration, setStreamDuration] = useState(0);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState("");
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isObsGuideOpen, setIsObsGuideOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [partyPointsPerMinute, setPartyPointsPerMinute] = useState(50);
  const [twoshotPointsPerMinute, setTwoshotPointsPerMinute] = useState(100);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [commentText, setCommentText] = useState("");

  // Streaming credentials
  const [rtmpServerUrl, setRtmpServerUrl] = useState<string | null>(null);
  const [rtmpStreamKey, setRtmpStreamKey] = useState<string | null>(null);
  const [whipUrl, setWhipUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // WHIP hook for camera streaming
  const whip = useWHIP({
    onConnected: () => toast({ title: "カメラ配信を開始しました" }),
    onDisconnected: () => console.log("WHIP disconnected"),
    onError: (err) => {
      console.error("WHIP error:", err);
      toast({ title: "カメラ配信の接続に失敗しました。OBS配信タブをお試しください。", variant: "destructive" });
    },
  });

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: myLiveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/my-live"],
  });

  const { data: liveChatMessages } = useQuery<any[]>({
    queryKey: ["/api/live", currentStreamId, "chat"],
    queryFn: () => fetch(`/api/live/${currentStreamId}/chat`).then(r => r.json()),
    enabled: !!currentStreamId && viewMode === "streaming",
    refetchInterval: 3000,
  });

  const { data: streamStatus } = useQuery<{
    activeSessionCount: number;
    hasParty: boolean;
    hasTwoshot: boolean;
    currentMode: string | null;
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
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      stream.getVideoTracks().forEach(t => { t.enabled = isCameraOn; });
      stream.getAudioTracks().forEach(t => { t.enabled = isMicOn; });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setLocalStream(stream);
    } catch {
      toast({ title: "カメラへのアクセスに失敗しました", variant: "destructive" });
    }
  }, [facingMode, isCameraOn, isMicOn, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setLocalStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Start camera when entering streaming mode (camera tab)
  useEffect(() => {
    if (viewMode === "streaming" && streamingTab === "camera") {
      startCamera();
    } else if (viewMode !== "streaming") {
      stopCamera();
    }
  }, [viewMode, streamingTab]);

  // Re-init camera on facingMode change
  useEffect(() => {
    if (viewMode === "streaming" && streamingTab === "camera") {
      startCamera();
    }
  }, [facingMode]);

  // Auto-connect WHIP when streaming tab is camera
  useEffect(() => {
    if (whipUrl && localStream && viewMode === "streaming" && streamingTab === "camera" && !whip.isConnected && !whip.isConnecting) {
      whip.connect(whipUrl, localStream).catch(console.error);
    }
  }, [whipUrl, localStream, viewMode, streamingTab]);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); whip.disconnect(); }, []);

  // Stream timer
  useEffect(() => {
    if (viewMode === "streaming") {
      timerRef.current = setInterval(() => setStreamDuration(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setStreamDuration(0);
      setEarnedPoints(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [viewMode]);

  // Points calculation
  useEffect(() => {
    if (viewMode !== "streaming") return;
    const t = setInterval(() => {
      const count = streamStatus?.activeSessionCount || 0;
      if (count > 0) {
        const rate = streamStatus?.hasTwoshot ? twoshotPointsPerMinute : partyPointsPerMinute;
        setEarnedPoints(p => p + rate * count);
      }
    }, 60000);
    return () => clearInterval(t);
  }, [viewMode, streamStatus?.activeSessionCount, streamStatus?.hasTwoshot, partyPointsPerMinute, twoshotPointsPerMinute]);

  // Heartbeat
  useEffect(() => {
    if (!currentStreamId || viewMode !== "streaming") return;
    const sendHeartbeat = () => apiRequest("POST", `/api/live/${currentStreamId}/heartbeat`).catch(console.error);
    sendHeartbeat();
    const t = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(t);
  }, [currentStreamId, viewMode]);

  const startLiveMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/live", {
        title,
        description: "",
        status: "live",
        thumbnailUrl: thumbnailUrl || undefined,
        partyRatePerMinute: partyPointsPerMinute,
        twoshotRatePerMinute: twoshotPointsPerMinute,
      });
      return res.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setCurrentStreamId(data.id);
      setViewMode("streaming");
      setStreamingTab("camera");
      if (data.rtmpServerUrl) setRtmpServerUrl(data.rtmpServerUrl);
      if (data.rtmpStreamKey) setRtmpStreamKey(data.rtmpStreamKey);
      if (data.whipUrl) {
        setWhipUrl(data.whipUrl);
        toast({ title: "配信準備完了！カメラを確認してください" });
      } else {
        toast({ title: "ライブ配信を開始しました" });
      }
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
      whip.disconnect();
      stopCamera();
      setViewMode("list");
      setCurrentStreamId(null);
      setRtmpServerUrl(null);
      setRtmpStreamKey(null);
      setWhipUrl(null);
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
      toast({ title: "配信履歴を削除しました" });
    },
    onError: () => toast({ title: "削除に失敗しました", variant: "destructive" }),
  });

  const handleStartLive = () => {
    if (!streamTitle.trim()) {
      toast({ title: "タイトルを入力してください", variant: "destructive" });
      return;
    }
    setIsTitleDialogOpen(false);
    startLiveMutation.mutate(streamTitle);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "コピーしました" });
    } catch {
      toast({ title: "コピーに失敗しました", variant: "destructive" });
    }
  };

  const handleShare = async (platform: string) => {
    const shareUrl = `${window.location.origin}/live/${currentStreamId}`;
    const shareText = `${displayName}のライブ配信を見に来てね！`;
    if (platform === "copy") {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: "リンクをコピーしました" });
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");
    } else if (platform === "line") {
      window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, "_blank");
    }
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
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${m}:${String(sec).padStart(2,"0")}`;
  };

  const displayName = profile?.displayName || user?.firstName || "クリエイター";
  const pastStreams = myLiveStreams?.filter(s => s.status !== "live") || [];

  // ─── STREAMING VIEW ───────────────────────────────────────────────────────
  if (viewMode === "streaming") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Camera background */}
        {streamingTab === "camera" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <CameraOff className="h-16 w-16 text-white/30" />
              </div>
            )}
          </>
        )}
        {streamingTab === "obs" && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black" />
        )}

        {/* TOP BAR */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-white/70" />
              <span className="text-white text-xs">{formatDuration(streamDuration)}</span>
            </div>
            <div className="bg-black/40 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1.5">
              <Users className="h-3 w-3 text-white/70" />
              <span className="text-white text-xs">{streamStatus?.activeSessionCount || 0}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-full shadow-lg"
            onClick={() => currentStreamId && endLiveMutation.mutate(currentStreamId)}
            disabled={endLiveMutation.isPending}
            data-testid="button-end-stream"
          >
            {endLiveMutation.isPending ? "終了中..." : "終了"}
          </Button>
        </div>

        {/* TAB SWITCHER */}
        <div className="relative z-10 flex justify-center px-4">
          <div className="bg-black/50 backdrop-blur rounded-full p-1 flex gap-1">
            <button
              onClick={() => setStreamingTab("camera")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                streamingTab === "camera" ? "bg-white text-black" : "text-white/70"
              }`}
              data-testid="tab-camera"
            >
              <Camera className="h-3.5 w-3.5" />
              カメラ
            </button>
            <button
              onClick={() => setStreamingTab("obs")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                streamingTab === "obs" ? "bg-white text-black" : "text-white/70"
              }`}
              data-testid="tab-obs"
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              OBS
            </button>
          </div>
        </div>

        {/* OBS TAB CONTENT */}
        {streamingTab === "obs" && (
          <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <div className="bg-black/60 backdrop-blur rounded-2xl border border-white/10 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-pink-400" />
                <h3 className="text-white font-semibold text-sm">OBS接続情報</h3>
                {whipUrl && (
                  <Badge variant="outline" className="text-xs border-green-500/40 text-green-400 ml-auto">
                    カメラ配信中
                  </Badge>
                )}
              </div>
              <div>
                <Label className="text-white/50 text-xs mb-1.5 block">配信サーバー</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/80 break-all">
                    {rtmpServerUrl || "rtmp://rtmp.livepeer.com/live"}
                  </div>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white/60"
                    onClick={() => copyToClipboard(rtmpServerUrl || "rtmp://rtmp.livepeer.com/live", "server")}>
                    {copiedField === "server" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-white/50 text-xs mb-1.5 block">ストリームキー</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-lg px-3 py-2 font-mono text-xs text-white/80 break-all">
                    {showStreamKey ? rtmpStreamKey : "•".repeat(Math.min((rtmpStreamKey || "").length, 24))}
                  </div>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white/60"
                    onClick={() => setShowStreamKey(p => !p)}>
                    {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white/60"
                    onClick={() => copyToClipboard(rtmpStreamKey!, "key")}>
                    {copiedField === "key" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-amber-400 text-[10px] mt-1">⚠ 他人に見せないでください</p>
              </div>
              <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => setIsObsGuideOpen(true)}>
                <BookOpen className="h-4 w-4 mr-2" />
                OBS設定ガイド
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/60 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
                <Coins className="h-4 w-4 mx-auto mb-1 text-yellow-400" />
                <p className="text-white font-bold">{earnedPoints.toLocaleString()}</p>
                <p className="text-white/50 text-[10px]">獲得ポイント</p>
              </div>
              <div className="bg-black/60 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
                <Signal className="h-4 w-4 mx-auto mb-1 text-green-400" />
                <p className="text-green-400 font-bold text-sm">配信中</p>
                <p className="text-white/50 text-[10px]">ステータス</p>
              </div>
            </div>
          </div>
        )}

        {/* CAMERA TAB CONTENT - Bottom overlay */}
        {streamingTab === "camera" && (
          <>
            {/* Camera controls */}
            <div className="relative z-10 flex items-center justify-center gap-4 mt-4">
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full bg-black/40 text-white"
                onClick={() => {
                  if (streamRef.current) streamRef.current.getVideoTracks().forEach(t => { t.enabled = !isCameraOn; });
                  setIsCameraOn(p => !p);
                }}
                data-testid="button-toggle-camera"
              >
                {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full bg-black/40 text-white"
                onClick={() => {
                  if (streamRef.current) streamRef.current.getAudioTracks().forEach(t => { t.enabled = !isMicOn; });
                  setIsMicOn(p => !p);
                }}
                data-testid="button-toggle-mic"
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full bg-black/40 text-white"
                onClick={() => setFacingMode(p => p === "user" ? "environment" : "user")}
                data-testid="button-switch-camera"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 rounded-full bg-black/40 text-white"
                onClick={() => setIsShareOpen(true)}
                data-testid="button-share"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* WHIP connection status */}
            <div className="relative z-10 px-4 mt-2">
              <div className="flex justify-center">
                {whip.isConnecting && (
                  <div className="bg-black/60 rounded-full px-3 py-1 flex items-center gap-2">
                    <div className="animate-spin h-3 w-3 border-2 border-pink-500 border-t-transparent rounded-full" />
                    <span className="text-white/80 text-xs">接続中...</span>
                  </div>
                )}
                {whip.isConnected && (
                  <div className="bg-green-500/20 border border-green-500/40 rounded-full px-3 py-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-400 text-xs font-medium">配信中</span>
                  </div>
                )}
                {!whip.isConnected && !whip.isConnecting && whipUrl && (
                  <button
                    onClick={() => localStream && whip.connect(whipUrl, localStream).catch(console.error)}
                    className="bg-pink-500/20 border border-pink-500/40 rounded-full px-3 py-1 text-pink-400 text-xs"
                  >
                    再接続する
                  </button>
                )}
              </div>
            </div>

            {/* Chat overlay */}
            <div className="relative z-10 flex-1 flex flex-col justify-end px-4 pb-2">
              <div className="max-h-40 overflow-y-auto space-y-1.5 mb-2">
                {(liveChatMessages || []).slice(-12).map((msg: any) => (
                  <div key={msg.id} className="flex items-start gap-2 bg-black/40 backdrop-blur rounded-xl px-3 py-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={msg.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-pink-500 text-white text-xs">{msg.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-pink-300 text-xs font-bold">{msg.displayName}</span>
                      <p className="text-white/90 text-xs break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendComment} className="flex items-center gap-2">
                <Input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="コメントを入力..."
                  className="flex-1 bg-black/50 border-white/20 text-white placeholder:text-white/40 rounded-full"
                  data-testid="input-comment"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-pink-500 hover:bg-pink-600 rounded-full"
                  disabled={!commentText.trim()}
                  data-testid="button-send-comment"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}

        {/* OBS tab chat at bottom */}
        {streamingTab === "obs" && (
          <div className="relative z-10 px-4 pb-4">
            <div className="bg-black/60 backdrop-blur rounded-2xl border border-white/10">
              <div className="max-h-32 overflow-y-auto p-3 space-y-1.5">
                {(liveChatMessages || []).slice(-8).map((msg: any) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <span className="text-pink-300 text-xs font-bold">{msg.displayName}:</span>
                    <span className="text-white/80 text-xs">{msg.message}</span>
                  </div>
                ))}
                {(!liveChatMessages || liveChatMessages.length === 0) && (
                  <p className="text-white/30 text-xs text-center py-2">チャットはまだありません</p>
                )}
              </div>
              <div className="p-2 border-t border-white/10">
                <form onSubmit={handleSendComment} className="flex items-center gap-2">
                  <Input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="コメントを入力..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/30 rounded-full text-sm"
                    data-testid="input-comment-obs"
                  />
                  <Button type="submit" size="icon" className="bg-pink-500 hover:bg-pink-600 rounded-full h-8 w-8"
                    disabled={!commentText.trim()} data-testid="button-send-comment-obs">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* OBS Guide */}
        <Sheet open={isObsGuideOpen} onOpenChange={setIsObsGuideOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle>OBS設定ガイド</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pb-8">
              {[
                { step: 1, title: "OBSを開く", desc: "OBS Studio（無料）をPCにインストールして起動します。" },
                { step: 2, title: "設定を開く", desc: "右下の「設定」→「配信」タブを選択します。" },
                { step: 3, title: "カスタムを選択", desc: "「サービス」で「カスタム」を選択します。" },
                { step: 4, title: "サーバーURLを入力", desc: "「サーバー」に上記の「配信サーバー」URLを貼り付けます。" },
                { step: 5, title: "ストリームキーを入力", desc: "「ストリームキー」に上記のキーを貼り付けます。" },
                { step: 6, title: "配信開始", desc: "「OK」で保存し「配信開始」をクリックします。" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-400 text-xs font-bold">{step}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-400 font-medium">📱 スマホから配信する場合</p>
                <p className="text-xs text-muted-foreground mt-1">Larix Broadcaster（iOS/Android無料）でも同じ情報で配信できます。</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Share Sheet */}
        <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
          <SheetContent side="bottom" className="h-60 rounded-t-3xl">
            <SheetHeader className="pb-4"><SheetTitle>ライブをシェア</SheetTitle></SheetHeader>
            <div className="flex items-center justify-around">
              {[
                { platform: "copy", icon: linkCopied ? <Check className="h-6 w-6 text-green-400" /> : <Copy className="h-6 w-6 text-white" />, label: linkCopied ? "コピー済み" : "リンク", bg: "bg-gray-700" },
                { platform: "twitter", icon: <Twitter className="h-6 w-6 text-white" />, label: "Twitter", bg: "bg-[#1DA1F2]" },
                { platform: "facebook", icon: <Facebook className="h-6 w-6 text-white" />, label: "Facebook", bg: "bg-[#4267B2]" },
                { platform: "line", icon: <MessageCircle className="h-6 w-6 text-white" />, label: "LINE", bg: "bg-[#00B900]" },
              ].map(({ platform, icon, label, bg }) => (
                <button key={platform} onClick={() => handleShare(platform)} className="flex flex-col items-center gap-2">
                  <div className={`h-14 w-14 rounded-full ${bg} flex items-center justify-center`}>{icon}</div>
                  <span className="text-xs">{label}</span>
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/account")} data-testid="button-back">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold">ライブ配信</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Start card */}
        <div className="p-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl text-center border border-pink-500/30">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Radio className="h-10 w-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">ライブ配信を開始</h3>
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Camera className="h-3.5 w-3.5 text-pink-400" />
              <span>ブラウザカメラで配信</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <MonitorPlay className="h-3.5 w-3.5 text-blue-400" />
              <span>OBS対応</span>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setIsTitleDialogOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
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
          <h2 className="font-bold mb-3">配信履歴</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pastStreams.length > 0 ? (
            <div className="space-y-2">
              {pastStreams.map((stream) => (
                <div key={stream.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg" data-testid={`stream-item-${stream.id}`}>
                  <div className="w-16 h-10 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0">
                    {stream.thumbnailUrl
                      ? <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover rounded-md" />
                      : <Radio className="h-5 w-5 text-white/50" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{stream.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                      <Badge variant="secondary" className="text-[10px]">
                        {stream.status === "ended" ? "終了" : stream.status}
                      </Badge>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{stream.viewerCount || 0}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                    onClick={() => deleteLiveMutation.mutate(stream.id)} data-testid={`button-delete-${stream.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/50">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">配信履歴はありません</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-24" />

      {/* Title Dialog */}
      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent className="w-[90vw] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>配信タイトルを設定</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="stream-title">タイトル</Label>
              <Input
                id="stream-title"
                value={streamTitle}
                onChange={e => setStreamTitle(e.target.value)}
                placeholder="今日のライブ配信"
                className="mt-1"
                onKeyDown={e => e.key === "Enter" && handleStartLive()}
                data-testid="input-stream-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">パーティーレート（/分）</Label>
                <Input type="number" value={partyPointsPerMinute}
                  onChange={e => setPartyPointsPerMinute(Number(e.target.value))}
                  className="mt-1" min={0} data-testid="input-party-rate" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">2ショットレート（/分）</Label>
                <Input type="number" value={twoshotPointsPerMinute}
                  onChange={e => setTwoshotPointsPerMinute(Number(e.target.value))}
                  className="mt-1" min={0} data-testid="input-twoshot-rate" />
              </div>
            </div>
            <Button
              onClick={handleStartLive}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
              disabled={!streamTitle.trim() || startLiveMutation.isPending}
              data-testid="button-confirm-start"
            >
              {startLiveMutation.isPending ? "配信準備中..." : "配信開始"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

