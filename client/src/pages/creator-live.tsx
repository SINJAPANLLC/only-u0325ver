import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Radio, 
  Users,
  Clock,
  Trash2,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
  Settings,
  Share2,
  Gift,
  Heart,
  MessageCircle,
  Zap,
  Target,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { LiveStream, UserProfile } from "@shared/schema";

type ViewMode = "list" | "preview" | "streaming";

export default function CreatorLive() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState("");
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: myLiveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/my-live"],
  });

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      stream.getVideoTracks().forEach(track => {
        track.enabled = isCameraOn;
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
      
    } catch (error) {
      console.error("Camera access error:", error);
      toast({ 
        title: "カメラへのアクセスに失敗しました", 
        description: "カメラの使用を許可してください",
        variant: "destructive" 
      });
      setViewMode("list");
    }
  }, [facingMode, isCameraOn, isMicOn, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
    }
    setIsCameraOn(!isCameraOn);
  }, [isCameraOn]);

  const toggleMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
  }, [isMicOn]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  }, []);

  useEffect(() => {
    if (viewMode === "preview" || viewMode === "streaming") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      if (viewMode === "list") {
        stopCamera();
      }
    };
  }, [viewMode, startCamera, stopCamera]);

  useEffect(() => {
    if (facingMode && (viewMode === "preview" || viewMode === "streaming")) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    if (viewMode === "streaming") {
      timerRef.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
        setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setStreamDuration(0);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [viewMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startLiveMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/live", {
        title,
        description: "",
        status: "live",
      });
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setCurrentStreamId(data.id);
      setViewMode("streaming");
      setViewerCount(Math.floor(Math.random() * 10) + 1);
      toast({ title: "ライブ配信を開始しました" });
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
      stopCamera();
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

  const handleClosePreview = () => {
    stopCamera();
    setViewMode("list");
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayName = profile?.displayName || user?.firstName || "クリエイター";
  const pastStreams = myLiveStreams?.filter(s => s.status !== "live") || [];

  if (viewMode === "preview") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        />
        
        {!isCameraOn && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <CameraOff className="h-16 w-16 text-white/50" />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 pt-12">
          <div className="flex items-center justify-between">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={handleClosePreview}
              data-testid="button-close"
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/90 text-white border-0">
                <Zap className="h-3 w-3 mr-1" />
                段階的LIVE報酬
              </Badge>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <Gift className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <div className="px-4 pt-8 pb-4">
            <div className="grid grid-cols-5 gap-4 mb-4">
              <button 
                onClick={switchCamera}
                className="flex flex-col items-center gap-1 text-white"
                data-testid="button-switch-camera"
              >
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <span className="text-xs">切り替え</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xs">美肌</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center relative">
                  <Sparkles className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-xs">エフェクト</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Settings className="h-5 w-5" />
                </div>
                <span className="text-xs">設定</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Crown className="h-5 w-5" />
                </div>
                <span className="text-xs">ビジネス</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-6">
              <button className="flex flex-col items-center gap-1 text-white/80">
                <Heart className="h-5 w-5" />
                <span className="text-xs">ファンクラブ</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white/80">
                <Zap className="h-5 w-5" />
                <span className="text-xs">サービス+</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white/80">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">交流</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white/80">
                <Share2 className="h-5 w-5" />
                <span className="text-xs">シェア</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white/80">
                <Radio className="h-5 w-5" />
                <span className="text-xs">プロモート</span>
              </button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatarUrl || ""} />
                  <AvatarFallback className="bg-pink-500 text-white text-xs">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-sm">Please like and share!</span>
              </div>
              <Badge variant="outline" className="text-white border-white/30">
                <Target className="h-3 w-3 mr-1" />
                LIVEゴール
              </Badge>
            </div>

            <Button
              className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-lg font-bold rounded-full"
              onClick={() => setIsTitleDialogOpen(true)}
              data-testid="button-start-live"
            >
              LIVEを開始
            </Button>

            <div className="flex justify-around mt-4 pt-4 border-t border-white/10">
              <button 
                onClick={toggleMic}
                className="flex items-center gap-2 text-white/80"
                data-testid="button-toggle-mic"
              >
                {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5 text-red-400" />}
                <span className="text-sm">音声チャット</span>
              </button>
              <button 
                onClick={toggleCamera}
                className="flex items-center gap-2 text-white/80"
                data-testid="button-toggle-camera"
              >
                {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5 text-red-400" />}
                <span className="text-sm">デバイスカメラ</span>
              </button>
              <button className="flex items-center gap-2 text-white/80">
                <Settings className="h-5 w-5" />
                <span className="text-sm">LIVE Manager</span>
              </button>
            </div>
          </div>
        </div>

        <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>配信タイトル</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="配信のタイトルを入力"
                data-testid="input-title"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsTitleDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button
                  className="flex-1 bg-pink-500 hover:bg-pink-600"
                  onClick={handleStartLive}
                  disabled={startLiveMutation.isPending}
                  data-testid="button-confirm-start"
                >
                  {startLiveMutation.isPending ? "開始中..." : "開始"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (viewMode === "streaming") {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
        />
        
        {!isCameraOn && (
          <div className="absolute inset-0 bg-gradient-to-b from-rose-900 to-rose-950 flex items-center justify-center">
            <CameraOff className="h-16 w-16 text-white/50" />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 pt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 ring-2 ring-pink-500">
                <AvatarImage src={profile?.avatarUrl || ""} />
                <AvatarFallback className="bg-pink-500 text-white">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Badge className="bg-amber-400 text-black border-0 font-medium">
                あなたのファンクラブ
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 bg-black/50 rounded-full">
                <Users className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">{viewerCount}</span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={handleEndStream}
                data-testid="button-close-stream"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="text-amber-400 border-amber-400/50">
              <Zap className="h-3 w-3 mr-1" />
              日間ランキング
            </Badge>
            <Badge variant="outline" className="text-white border-white/30">
              今すぐ追加
            </Badge>
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={toggleCamera}
            data-testid="button-toggle-camera-stream"
          >
            {isCameraOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={toggleMic}
            data-testid="button-toggle-mic-stream"
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={switchCamera}
            data-testid="button-switch-camera-stream"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute left-4 bottom-36 max-h-60 overflow-y-auto space-y-2 w-64">
          <div className="bg-black/60 rounded-lg p-3 text-white text-sm">
            <p className="text-pink-400 font-medium mb-1">Only-U LIVEへようこそ！</p>
            <p className="text-white/80 text-xs leading-relaxed">
              リアルタイムで視聴者と楽しく交流しましょう。クリエイターは18歳以上でなければLIVEを配信することはできません。
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-pink-500 text-white text-xs">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="text-white text-sm font-medium">{displayName}</span>
                <Badge className="bg-pink-500/80 text-white text-[10px] px-1">配信者</Badge>
              </div>
              <p className="text-white/60 text-xs">{streamTitle}</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Input
                placeholder="コメントを入力..."
                className="bg-black/50 border-white/20 text-white placeholder:text-white/40 rounded-full"
                data-testid="input-comment"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="text-white/80">
                <Heart className="h-6 w-6" />
              </button>
              <button className="text-white/80">
                <Users className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-white/80">
                <Gift className="h-6 w-6" />
              </button>
              <button className="text-white/80">
                <Share2 className="h-6 w-6" />
              </button>
              <button className="text-white/80">
                <Sparkles className="h-6 w-6" />
              </button>
              <button className="text-white/80">
                <Settings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-4 -translate-y-1/2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 rounded-full">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-bold">LIVE</span>
            <span className="text-white/80 text-sm">{formatDuration(streamDuration)}</span>
          </div>
        </div>
      </div>
    );
  }

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
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold">ライブ配信</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="p-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl text-center border border-pink-500/30">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Radio className="h-10 w-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">ライブ配信を開始</h3>
          <p className="text-sm text-muted-foreground mb-6">
            カメラを使ってリアルタイムでフォロワーに配信しましょう
          </p>
          <Button
            size="lg"
            onClick={() => setViewMode("preview")}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            data-testid="button-open-preview"
          >
            <Camera className="h-5 w-5 mr-2" />
            配信準備
          </Button>
        </div>

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
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  data-testid={`stream-item-${stream.id}`}
                >
                  <div className="w-16 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    {stream.thumbnailUrl ? (
                      <img 
                        src={stream.thumbnailUrl} 
                        alt={stream.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Radio className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{stream.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
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
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">配信履歴はありません</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-24" />
    </motion.div>
  );
}
