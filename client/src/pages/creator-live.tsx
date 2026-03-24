import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Radio, 
  Users,
  Clock,
  Trash2,
  Sparkles,
  Share2,
  Heart,
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
  Wifi
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

export default function CreatorLive() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [viewerCount, setViewerCount] = useState(0);
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

  // RTMP credentials from Wowza
  const [rtmpServerUrl, setRtmpServerUrl] = useState<string | null>(null);
  const [rtmpStreamKey, setRtmpStreamKey] = useState<string | null>(null);
  const [hlsPlaybackUrl, setHlsPlaybackUrl] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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

  // Stream duration timer
  useEffect(() => {
    if (viewMode === "streaming") {
      timerRef.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setStreamDuration(0);
      setEarnedPoints(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode]);

  // Points calculation based on active sessions
  useEffect(() => {
    if (viewMode !== "streaming") return;
    const pointsTimer = setInterval(() => {
      const activeCount = streamStatus?.activeSessionCount || 0;
      if (activeCount > 0) {
        const ratePerViewer = streamStatus?.hasTwoshot ? twoshotPointsPerMinute : partyPointsPerMinute;
        setEarnedPoints(current => current + (ratePerViewer * activeCount));
      }
    }, 60000);
    return () => clearInterval(pointsTimer);
  }, [viewMode, streamStatus?.activeSessionCount, streamStatus?.hasTwoshot, partyPointsPerMinute, twoshotPointsPerMinute]);

  // Heartbeat while streaming
  useEffect(() => {
    if (!currentStreamId || viewMode !== "streaming") return;
    const sendHeartbeat = async () => {
      try {
        await apiRequest("POST", `/api/live/${currentStreamId}/heartbeat`);
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000);
    return () => clearInterval(interval);
  }, [currentStreamId, viewMode]);

  const startLiveMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/live", {
        title,
        description: "",
        status: "live",
        thumbnailUrl: thumbnailUrl || undefined,
        partyRatePerMinute: partyPointsPerMinute,
        twoshotRatePerMinute: twoshotPointsPerMinute,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setCurrentStreamId(data.id);
      setViewMode("streaming");
      setViewerCount(0);
      if (data.rtmpServerUrl && data.rtmpStreamKey) {
        setRtmpServerUrl(data.rtmpServerUrl);
        setRtmpStreamKey(data.rtmpStreamKey);
        setHlsPlaybackUrl(data.bunnyPlaybackUrl || null);
        toast({ title: "ライブ配信を開始しました。OBSでRTMP接続してください。" });
      } else {
        toast({ title: "ライブ配信を開始しました（配信サービス未設定）", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      const message = error?.message || "配信の開始に失敗しました。クリエイター登録が必要です。";
      toast({ title: message, variant: "destructive" });
    },
  });

  const endLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/live/${id}`, {
        status: "ended",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setViewMode("list");
      setCurrentStreamId(null);
      setRtmpServerUrl(null);
      setRtmpStreamKey(null);
      setHlsPlaybackUrl(null);
      toast({ title: "配信を終了しました" });
    },
    onError: () => {
      toast({ title: "配信終了に失敗しました", variant: "destructive" });
    },
  });

  const deleteLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/live/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      toast({ title: "配信履歴を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
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

  const handleEndStream = () => {
    if (currentStreamId) {
      endLiveMutation.mutate(currentStreamId);
    }
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
    const shareUrl = `${window.location.origin}/live/${currentStreamId || "preview"}`;
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
      await apiRequest("POST", `/api/live/${currentStreamId}/chat`, {
        message: commentText.trim(),
      });
      setCommentText("");
    } catch (err) {
      console.error("Failed to send comment:", err);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayName = profile?.displayName || user?.firstName || "クリエイター";
  const pastStreams = myLiveStreams?.filter(s => s.status !== "live") || [];

  // STREAMING VIEW
  if (viewMode === "streaming") {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs font-bold">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(streamDuration)}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndStream}
              disabled={endLiveMutation.isPending}
              data-testid="button-end-stream"
            >
              {endLiveMutation.isPending ? "終了中..." : "配信終了"}
            </Button>
          </div>
          <p className="text-sm font-medium mt-1 truncate">{streamTitle}</p>
        </div>

        <div className="p-4 space-y-4 pb-24">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl p-3 text-center border border-border/50">
              <Users className="h-5 w-5 mx-auto mb-1 text-blue-400" />
              <p className="text-lg font-bold">{streamStatus?.activeSessionCount || 0}</p>
              <p className="text-[10px] text-muted-foreground">視聴者</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center border border-border/50">
              <Coins className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
              <p className="text-lg font-bold">{earnedPoints.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">獲得ポイント</p>
            </div>
            <div className="bg-card rounded-xl p-3 text-center border border-border/50">
              <Signal className="h-5 w-5 mx-auto mb-1 text-green-400" />
              <p className="text-lg font-bold text-green-400">
                {rtmpServerUrl ? "接続待ち" : "未設定"}
              </p>
              <p className="text-[10px] text-muted-foreground">配信状態</p>
            </div>
          </div>

          {/* RTMP Credentials Card */}
          {rtmpServerUrl ? (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-pink-400" />
                  <h3 className="font-semibold text-sm">OBS接続情報</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">OBSにこの情報を入力して配信を開始してください</p>
              </div>
              <div className="p-4 space-y-4">
                {/* RTMP Server URL */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">配信サーバー (Stream URL)</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
                      {rtmpServerUrl}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => copyToClipboard(rtmpServerUrl, "server")}
                      data-testid="button-copy-rtmp-server"
                    >
                      {copiedField === "server" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Stream Key */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">ストリームキー (Stream Key)</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-xs break-all">
                      {showStreamKey ? rtmpStreamKey : "•".repeat(Math.min((rtmpStreamKey || "").length, 24))}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                      data-testid="button-toggle-key-visibility"
                    >
                      {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 flex-shrink-0"
                      onClick={() => copyToClipboard(rtmpStreamKey!, "key")}
                      data-testid="button-copy-stream-key"
                    >
                      {copiedField === "key" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-amber-400 mt-1">⚠ ストリームキーは他人に見せないでください</p>
                </div>
              </div>

              {/* OBS Guide button */}
              <div className="px-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsObsGuideOpen(true)}
                  data-testid="button-obs-guide"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  OBS設定ガイドを見る
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
              <MonitorPlay className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">配信サービスが設定されていません</p>
              <p className="text-xs text-muted-foreground mt-1">管理者にWowza設定を確認してください</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsShareOpen(true)}
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              シェア
            </Button>
          </div>

          {/* Chat section */}
          <div className="bg-card rounded-xl border border-border/50">
            <div className="px-4 py-3 border-b border-border/50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-pink-400" />
                チャット
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto p-3 space-y-2">
              {(liveChatMessages || []).slice(-20).map((msg: any) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    <AvatarImage src={msg.avatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-pink-500 text-white text-xs">
                      {msg.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 bg-muted rounded-lg px-3 py-2">
                    <span className="text-pink-400 text-xs font-bold">{msg.displayName}</span>
                    <p className="text-xs break-words mt-0.5">{msg.message}</p>
                  </div>
                </div>
              ))}
              {(!liveChatMessages || liveChatMessages.length === 0) && (
                <p className="text-center text-xs text-muted-foreground py-4">チャットはまだありません</p>
              )}
            </div>
            <div className="p-3 border-t border-border/50">
              <form onSubmit={handleSendComment} className="flex items-center gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="コメントを入力..."
                  className="flex-1 rounded-full text-sm"
                  data-testid="input-comment"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-pink-500 hover:bg-pink-600 rounded-full h-9 w-9"
                  disabled={!commentText.trim()}
                  data-testid="button-send-comment"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* OBS Guide Sheet */}
        <Sheet open={isObsGuideOpen} onOpenChange={setIsObsGuideOpen}>
          <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <MonitorPlay className="h-5 w-5 text-pink-400" />
                OBS設定ガイド
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 pb-8">
              {[
                { step: 1, title: "OBSを開く", desc: "OBS Studio（無料ソフト）をPCにインストールして起動します。" },
                { step: 2, title: "設定を開く", desc: "右下の「設定」ボタンをクリックし、「配信」タブを選択します。" },
                { step: 3, title: "サービスを選択", desc: "「サービス」で「カスタム」を選択します。" },
                { step: 4, title: "サーバーURLを入力", desc: "「サーバー」フィールドに上記の「配信サーバー」URLを貼り付けます。" },
                { step: 5, title: "ストリームキーを入力", desc: "「ストリームキー」フィールドに上記の「ストリームキー」を貼り付けます。" },
                { step: 6, title: "配信開始", desc: "「OK」を押して設定を保存し、「配信開始」ボタンをクリックします。" },
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
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs text-amber-400 font-medium">📱 スマートフォンから配信する場合</p>
                <p className="text-xs text-muted-foreground mt-1">Larix Broadcaster（iOS/Android対応、無料）でも同じRTMP情報を使って配信できます。</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Share Sheet */}
        <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
          <SheetContent side="bottom" className="h-64 rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>ライブをシェア</SheetTitle>
            </SheetHeader>
            <div className="flex items-center justify-around">
              <button
                onClick={() => handleShare("copy")}
                className="flex flex-col items-center gap-2"
                data-testid="button-share-copy"
              >
                <div className="h-14 w-14 rounded-full bg-gray-700 flex items-center justify-center">
                  {linkCopied ? <Check className="h-6 w-6 text-green-400" /> : <Copy className="h-6 w-6 text-white" />}
                </div>
                <span className="text-xs">{linkCopied ? "コピー済み" : "リンク"}</span>
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-2"
                data-testid="button-share-twitter"
              >
                <div className="h-14 w-14 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                  <Twitter className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs">Twitter</span>
              </button>
              <button
                onClick={() => handleShare("facebook")}
                className="flex flex-col items-center gap-2"
                data-testid="button-share-facebook"
              >
                <div className="h-14 w-14 rounded-full bg-[#4267B2] flex items-center justify-center">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs">Facebook</span>
              </button>
              <button
                onClick={() => handleShare("line")}
                className="flex flex-col items-center gap-2"
                data-testid="button-share-line"
              >
                <div className="h-14 w-14 rounded-full bg-[#00B900] flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs">LINE</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // LIST VIEW
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
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold">ライブ配信</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Start live card */}
        <div className="p-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl text-center border border-pink-500/30">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Radio className="h-10 w-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">ライブ配信を開始</h3>
          <p className="text-sm text-white/60 mb-2">
            OBS StudioやLarix BroadcasterでRTMP配信できます
          </p>
          <p className="text-xs text-white/40 mb-6">
            配信開始後にRTMPサーバーURLとストリームキーが表示されます
          </p>
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
              <>
                <Radio className="h-5 w-5 mr-2" />
                配信を開始する
              </>
            )}
          </Button>
        </div>

        {/* HOW IT WORKS */}
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-400" />
            配信の流れ
          </h3>
          <div className="space-y-2">
            {[
              "「配信を開始する」をタップしてタイトルを設定",
              "表示されるRTMPサーバーURLとストリームキーをコピー",
              "OBSまたはLarix BroadcasterにRTMP情報を入力",
              "配信開始！視聴者がHLSで視聴できます",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs font-bold text-pink-400 mt-0.5 w-4 flex-shrink-0">{i + 1}.</span>
                <p className="text-xs text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
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
                <div
                  key={stream.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                  data-testid={`stream-item-${stream.id}`}
                >
                  <div className="w-16 h-10 bg-white/10 rounded-md flex items-center justify-center flex-shrink-0">
                    {stream.thumbnailUrl ? (
                      <img
                        src={stream.thumbnailUrl}
                        alt={stream.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Radio className="h-5 w-5 text-white/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{stream.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-white/50">
                      <Badge variant="secondary" className="text-[10px]">
                        {stream.status === "ended" ? "終了" : stream.status}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {stream.viewerCount || 0}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteLiveMutation.mutate(stream.id)}
                    data-testid={`button-delete-${stream.id}`}
                  >
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
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="今日のライブ配信"
                className="mt-1"
                onKeyDown={(e) => e.key === "Enter" && handleStartLive()}
                data-testid="input-stream-title"
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
              {startLiveMutation.isPending ? "配信準備中..." : "配信開始"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
