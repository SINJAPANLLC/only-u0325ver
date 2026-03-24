import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
  Heart,
  ChevronLeft,
  Sun,
  Contrast,
  Palette,
  Volume2,
  Video,
  Smartphone,
  Copy,
  Twitter,
  Facebook,
  MessageCircle,
  Check,
  Send,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWHIP } from "@/hooks/use-whip";
import { useUpload } from "@/hooks/use-upload";
import { ImagePlus, Loader2 } from "lucide-react";
import type { LiveStream, UserProfile } from "@shared/schema";

type ViewMode = "list" | "preview" | "streaming";

interface EffectSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  beautyMode: boolean;
}

interface StreamSettings {
  resolution: "720p" | "1080p";
  frameRate: 30 | 60;
  audioBitrate: "low" | "medium" | "high";
  lowLatencyMode: boolean;
  saveToDevice: boolean;
}

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
  
  const [isEffectsOpen, setIsEffectsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [effects, setEffects] = useState<EffectSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    beautyMode: false,
  });
  
  const [settings, setSettings] = useState<StreamSettings>({
    resolution: "1080p",
    frameRate: 30,
    audioBitrate: "medium",
    lowLatencyMode: true,
    saveToDevice: false,
  });
  
  const [commentText, setCommentText] = useState("");
  const [partyPointsPerMinute, setPartyPointsPerMinute] = useState(50);
  const [twoshotPointsPerMinute, setTwoshotPointsPerMinute] = useState(100);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const effectsRef = useRef(effects);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const [bunnyWhipUrl, setBunnyWhipUrl] = useState<string | null>(null);

  const whip = useWHIP({
    onConnected: () => {
      toast({ title: "Bunny Streamに接続しました" });
    },
    onDisconnected: () => {
      console.log("WHIP disconnected");
    },
    onError: (error) => {
      console.error("WHIP error:", error);
    },
  });

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: myLiveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/my-live"],
  });

  // Live chat messages from the API (creator view)
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
    refetchInterval: 3000,
    enabled: !!currentStreamId && viewMode === "streaming",
  });

  const currentSessionMode = streamStatus?.currentMode || null;

  const { uploadFile, isUploading: isUploadingThumbnail } = useUpload({
    onSuccess: (response) => {
      setThumbnailUrl(response.objectPath);
      toast({ title: "背景画像を設定しました" });
    },
    onError: () => {
      toast({ title: "画像のアップロードに失敗しました", variant: "destructive" });
    },
  });

  const handleThumbnailUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "画像ファイルを選択してください", variant: "destructive" });
        return;
      }
      await uploadFile(file);
    }
  }, [uploadFile, toast]);

  useEffect(() => {
    effectsRef.current = effects;
  }, [effects]);

  const getVideoFilters = useCallback(() => {
    const filters: string[] = [];
    if (effects.brightness !== 100) filters.push(`brightness(${effects.brightness}%)`);
    if (effects.contrast !== 100) filters.push(`contrast(${effects.contrast}%)`);
    if (effects.saturation !== 100) filters.push(`saturate(${effects.saturation}%)`);
    if (effects.blur > 0) filters.push(`blur(${effects.blur}px)`);
    if (effects.beautyMode) {
      filters.push("contrast(105%)");
      filters.push("brightness(103%)");
    }
    return filters.join(" ") || "none";
  }, [effects]);

  const getCanvasFilters = useCallback(() => {
    const e = effectsRef.current;
    const filters: string[] = [];
    if (e.brightness !== 100) filters.push(`brightness(${e.brightness}%)`);
    if (e.contrast !== 100) filters.push(`contrast(${e.contrast}%)`);
    if (e.saturation !== 100) filters.push(`saturate(${e.saturation}%)`);
    if (e.blur > 0) filters.push(`blur(${e.blur}px)`);
    if (e.beautyMode) {
      filters.push("contrast(105%)");
      filters.push("brightness(103%)");
    }
    return filters.join(" ") || "none";
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      const videoConstraints: MediaTrackConstraints = {
        facingMode,
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 60, min: 30 }
      };
      
      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
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

      // Set up canvas processing for effects
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (canvas && video) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const processFrame = () => {
            if (video.readyState >= 2) {
              canvas.width = video.videoWidth || 1920;
              canvas.height = video.videoHeight || 1080;
              
              ctx.filter = getCanvasFilters();
              
              if (facingMode === "user") {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
              }
              
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              if (facingMode === "user") {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
              }
            }
            animationFrameRef.current = requestAnimationFrame(processFrame);
          };
          processFrame();

          // Create canvas stream with audio from original stream
          const canvasStream = canvas.captureStream(30);
          const audioTracks = stream.getAudioTracks();
          audioTracks.forEach(track => {
            canvasStream.addTrack(track);
          });
          canvasStreamRef.current = canvasStream;
          setLocalStream(canvasStream);
        }
      }
      
    } catch (error) {
      console.error("Camera access error:", error);
      toast({ 
        title: "カメラへのアクセスに失敗しました", 
        description: "カメラの使用を許可してください",
        variant: "destructive" 
      });
      setViewMode("list");
    }
  }, [facingMode, isCameraOn, isMicOn, toast, settings.resolution, settings.frameRate, getCanvasFilters]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach(track => track.stop());
      canvasStreamRef.current = null;
    }
    setLocalStream(null);
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
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setStreamDuration(0);
      setEarnedPoints(0);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [viewMode]);

  // Points are calculated based on actual active sessions, not time alone
  // Points are added every minute only when there are viewers in paid modes
  useEffect(() => {
    if (viewMode !== "streaming") return;
    
    const pointsTimer = setInterval(() => {
      // Only add points if there are active paid sessions
      const activeCount = streamStatus?.activeSessionCount || 0;
      if (activeCount > 0) {
        // Calculate points based on mode - if twoshot exists, use twoshot rate, otherwise party rate
        const ratePerViewer = streamStatus?.hasTwoshot ? twoshotPointsPerMinute : partyPointsPerMinute;
        setEarnedPoints(current => current + (ratePerViewer * activeCount));
      }
    }, 60000); // Every minute
    
    return () => clearInterval(pointsTimer);
  }, [viewMode, streamStatus?.activeSessionCount, streamStatus?.hasTwoshot, partyPointsPerMinute, twoshotPointsPerMinute]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Auto-connect WHIP when we have both the URL and a stream
  useEffect(() => {
    if (bunnyWhipUrl && localStream && viewMode === "streaming" && !whip.isConnected && !whip.isConnecting) {
      whip.connect(bunnyWhipUrl, localStream).catch(console.error);
    }
  }, [bunnyWhipUrl, localStream, viewMode]);

  // Send heartbeat every 10 seconds while streaming
  useEffect(() => {
    if (!currentStreamId || viewMode !== "streaming") return;
    
    const sendHeartbeat = async () => {
      try {
        await apiRequest("POST", `/api/live/${currentStreamId}/heartbeat`);
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    };
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Send heartbeat every 10 seconds
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
      // Connect to Bunny via WHIP if URL is available
      if (data.bunnyWhipUrl && localStream) {
        setBunnyWhipUrl(data.bunnyWhipUrl);
        whip.connect(data.bunnyWhipUrl, localStream).catch(console.error);
        toast({ title: "ライブ配信を開始しました" });
      } else {
        toast({ title: "ライブ配信を開始しました（Bunnyチャンネル未割当）", variant: "destructive" });
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
      whip.disconnect();
      setBunnyWhipUrl(null);
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
    } else if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
      } catch (e) {
        console.log("Share cancelled");
      }
    }
  };

  const resetEffects = () => {
    setEffects({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      beautyMode: false,
    });
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
          style={{ filter: getVideoFilters() }}
          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
        <canvas ref={canvasRef} className="hidden" />
        
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
              data-testid="button-back"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setIsEffectsOpen(true)}
                data-testid="button-effects"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setIsShareOpen(true)}
                data-testid="button-share"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setIsSettingsOpen(true)}
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="mb-4 bg-black/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white">
                <ImagePlus className="h-5 w-5 text-pink-400" />
                <span className="font-medium">接続中の背景画像</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-white border-white/40 hover:bg-white/20"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={isUploadingThumbnail}
                data-testid="button-upload-thumbnail"
              >
                {isUploadingThumbnail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : thumbnailUrl ? (
                  "変更"
                ) : (
                  "選択"
                )}
              </Button>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
            </div>
            {thumbnailUrl && (
              <div className="mb-3 relative">
                <img 
                  src={thumbnailUrl} 
                  alt="接続中背景" 
                  className="w-full h-20 object-cover rounded-lg opacity-80"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setThumbnailUrl("")}
                  data-testid="button-remove-thumbnail"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-white/60 mb-3">
              視聴者が配信に接続中に表示される縦型画像
            </p>
          </div>
          <div className="mb-4 bg-black/40 rounded-xl p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-pink-400" />
                  <span className="font-medium">パーティー（1分あたり）</span>
                </div>
                <span className="text-pink-400 font-bold">{partyPointsPerMinute}pt</span>
              </div>
              <Slider
                value={[partyPointsPerMinute]}
                onValueChange={([v]) => setPartyPointsPerMinute(v)}
                min={10}
                max={500}
                step={10}
                className="mt-2"
                data-testid="slider-party-points"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>10pt</span>
                <span>500pt</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white">
                  <Heart className="h-5 w-5 text-purple-400" />
                  <span className="font-medium">2ショット（1分あたり）</span>
                </div>
                <span className="text-purple-400 font-bold">{twoshotPointsPerMinute}pt</span>
              </div>
              <Slider
                value={[twoshotPointsPerMinute]}
                onValueChange={([v]) => setTwoshotPointsPerMinute(v)}
                min={10}
                max={1000}
                step={10}
                className="mt-2"
                data-testid="slider-twoshot-points"
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>10pt</span>
                <span>1000pt</span>
              </div>
            </div>
          </div>
          <Button
            className="w-full h-14 bg-pink-500 hover:bg-pink-600 text-lg font-bold rounded-full"
            onClick={() => setIsTitleDialogOpen(true)}
            data-testid="button-start-live"
          >
            LIVEを開始
          </Button>
        </div>

        <Sheet open={isEffectsOpen} onOpenChange={setIsEffectsOpen}>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center justify-between">
                <span>エフェクト</span>
                <Button variant="ghost" size="sm" onClick={resetEffects}>
                  リセット
                </Button>
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  <Label>美肌モード</Label>
                </div>
                <Switch
                  checked={effects.beautyMode}
                  onCheckedChange={(checked) => setEffects(prev => ({ ...prev, beautyMode: checked }))}
                  data-testid="switch-beauty"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <Label>明るさ: {effects.brightness}%</Label>
                </div>
                <Slider
                  value={[effects.brightness]}
                  onValueChange={([v]) => setEffects(prev => ({ ...prev, brightness: v }))}
                  min={50}
                  max={150}
                  step={1}
                  data-testid="slider-brightness"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Contrast className="h-5 w-5 text-blue-500" />
                  <Label>コントラスト: {effects.contrast}%</Label>
                </div>
                <Slider
                  value={[effects.contrast]}
                  onValueChange={([v]) => setEffects(prev => ({ ...prev, contrast: v }))}
                  min={50}
                  max={150}
                  step={1}
                  data-testid="slider-contrast"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-purple-500" />
                  <Label>彩度: {effects.saturation}%</Label>
                </div>
                <Slider
                  value={[effects.saturation]}
                  onValueChange={([v]) => setEffects(prev => ({ ...prev, saturation: v }))}
                  min={0}
                  max={200}
                  step={1}
                  data-testid="slider-saturation"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                  <Label>ぼかし: {effects.blur}px</Label>
                </div>
                <Slider
                  value={[effects.blur]}
                  onValueChange={([v]) => setEffects(prev => ({ ...prev, blur: v }))}
                  min={0}
                  max={10}
                  step={0.5}
                  data-testid="slider-blur"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>配信設定</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-pink-500" />
                  <Label>解像度</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={settings.resolution === "720p" ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({ ...prev, resolution: "720p" }))}
                    data-testid="button-720p"
                  >
                    720p HD
                  </Button>
                  <Button
                    variant={settings.resolution === "1080p" ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({ ...prev, resolution: "1080p" }))}
                    data-testid="button-1080p"
                  >
                    1080p Full HD
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                  <Label>フレームレート</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={settings.frameRate === 30 ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({ ...prev, frameRate: 30 }))}
                    data-testid="button-30fps"
                  >
                    30 FPS
                  </Button>
                  <Button
                    variant={settings.frameRate === 60 ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({ ...prev, frameRate: 60 }))}
                    data-testid="button-60fps"
                  >
                    60 FPS
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-green-500" />
                  <Label>音声品質</Label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={settings.audioBitrate === "low" ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({ ...prev, audioBitrate: "low" }))}
                    size="sm"
                    data-testid="button-audio-low"
                  >
                    低
                  </Button>
                  <Button
                    variant={settings.audioBitrate === "medium" ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({ ...prev, audioBitrate: "medium" }))}
                    size="sm"
                    data-testid="button-audio-medium"
                  >
                    中
                  </Button>
                  <Button
                    variant={settings.audioBitrate === "high" ? "default" : "outline"}
                    onClick={() => setSettings(prev => ({ ...prev, audioBitrate: "high" }))}
                    size="sm"
                    data-testid="button-audio-high"
                  >
                    高
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-orange-500" />
                  <Label>低遅延モード</Label>
                </div>
                <Switch
                  checked={settings.lowLatencyMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, lowLatencyMode: checked }))}
                  data-testid="switch-low-latency"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-purple-500" />
                  <Label>端末に保存</Label>
                </div>
                <Switch
                  checked={settings.saveToDevice}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, saveToDevice: checked }))}
                  data-testid="switch-save"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
          <SheetContent side="bottom" className="h-auto rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>シェア</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 pb-6">
              <button
                onClick={() => handleShare("copy")}
                className="flex flex-col items-center gap-2"
                data-testid="button-share-copy"
              >
                <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {linkCopied ? <Check className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                </div>
                <span className="text-xs">{linkCopied ? "コピー済み" : "リンクをコピー"}</span>
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
          style={{ filter: getVideoFilters() }}
          className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isCameraOn && (
          <div className="absolute inset-0 bg-gradient-to-b from-rose-900 to-rose-950 flex items-center justify-center">
            <CameraOff className="h-16 w-16 text-white/50" />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 pt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-bold">LIVE</span>
                <span className="text-white/80 text-sm">{formatDuration(streamDuration)}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-black/50 rounded-full">
                <Users className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">{viewerCount}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/80 rounded-full">
                <Coins className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-bold">{earnedPoints.toLocaleString()}pt</span>
              </div>
              {currentSessionMode ? (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                  currentSessionMode === "twoshot" ? "bg-purple-500" : "bg-pink-500"
                }`}>
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-sm font-bold">
                    {currentSessionMode === "twoshot" ? "2SHOT中" : "パーティー中"}
                  </span>
                  <span className="text-white/80 text-xs">({streamStatus?.activeSessionCount || 0}人)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/80 rounded-full">
                  <span className="text-white text-sm">待機中</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 px-4"
              onClick={handleEndStream}
              data-testid="button-end-stream"
            >
              配信終了
            </Button>
          </div>
        </div>

        <div className="absolute right-4 bottom-36 flex flex-col gap-3">
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
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={() => setIsEffectsOpen(true)}
            data-testid="button-effects-stream"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={() => setIsShareOpen(true)}
            data-testid="button-share-stream"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute left-4 bottom-28 max-h-48 overflow-y-auto space-y-2 w-64">
          {(liveChatMessages || []).slice(-15).map((msg: any) => (
            <div key={msg.id} className="flex items-start gap-2 bg-black/40 rounded-lg px-3 py-2">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={msg.avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-pink-500 text-white text-xs">
                  {msg.displayName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <span className="text-pink-300 text-xs font-bold">{msg.displayName}</span>
                <p className="text-white/90 text-xs break-words">{msg.message}</p>
              </div>
            </div>
          ))}
          {(!liveChatMessages || liveChatMessages.length === 0) && (
            <div className="bg-black/60 rounded-lg p-3 text-white text-sm">
              <p className="text-pink-400 font-medium mb-1">
                {whip.isConnecting ? "Bunny接続中..." : whip.isConnected ? "Bunny Stream配信中" : bunnyWhipUrl ? "配信中" : "チャンネルなし"}
              </p>
              <p className="text-white/80 text-xs leading-relaxed">
                {streamTitle || "ライブ配信"}
              </p>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <form onSubmit={handleSendComment} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="コメントを入力..."
                className="bg-black/50 border-white/20 text-white placeholder:text-white/40 rounded-full pr-12"
                data-testid="input-comment"
              />
            </div>
            <Button 
              type="submit"
              size="icon" 
              className="bg-pink-500 hover:bg-pink-600 rounded-full"
              disabled={!commentText.trim()}
              data-testid="button-send-comment"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>

        <Sheet open={isEffectsOpen} onOpenChange={setIsEffectsOpen}>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center justify-between">
                <span>エフェクト</span>
                <Button variant="ghost" size="sm" onClick={resetEffects}>
                  リセット
                </Button>
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  <Label>美肌モード</Label>
                </div>
                <Switch
                  checked={effects.beautyMode}
                  onCheckedChange={(checked) => setEffects(prev => ({ ...prev, beautyMode: checked }))}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <Label>明るさ: {effects.brightness}%</Label>
                </div>
                <Slider
                  value={[effects.brightness]}
                  onValueChange={([v]) => setEffects(prev => ({ ...prev, brightness: v }))}
                  min={50}
                  max={150}
                  step={1}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Contrast className="h-5 w-5 text-blue-500" />
                  <Label>コントラスト: {effects.contrast}%</Label>
                </div>
                <Slider
                  value={[effects.contrast]}
                  onValueChange={([v]) => setEffects(prev => ({ ...prev, contrast: v }))}
                  min={50}
                  max={150}
                  step={1}
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-purple-500" />
                  <Label>彩度: {effects.saturation}%</Label>
                </div>
                <Slider
                  value={[effects.saturation]}
                  onValueChange={([v]) => setEffects(prev => ({ ...prev, saturation: v }))}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isShareOpen} onOpenChange={setIsShareOpen}>
          <SheetContent side="bottom" className="h-auto rounded-t-3xl">
            <SheetHeader className="pb-4">
              <SheetTitle>シェア</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 pb-6">
              <button
                onClick={() => handleShare("copy")}
                className="flex flex-col items-center gap-2"
              >
                <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {linkCopied ? <Check className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                </div>
                <span className="text-xs">{linkCopied ? "コピー済み" : "リンクをコピー"}</span>
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="flex flex-col items-center gap-2"
              >
                <div className="h-14 w-14 rounded-full bg-[#1DA1F2] flex items-center justify-center">
                  <Twitter className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs">Twitter</span>
              </button>
              <button
                onClick={() => handleShare("facebook")}
                className="flex flex-col items-center gap-2"
              >
                <div className="h-14 w-14 rounded-full bg-[#4267B2] flex items-center justify-center">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs">Facebook</span>
              </button>
              <button
                onClick={() => handleShare("line")}
                className="flex flex-col items-center gap-2"
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
        <div className="p-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl text-center border border-pink-500/30">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Radio className="h-10 w-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">ライブ配信を開始</h3>
          <p className="text-sm text-white/50 mb-6">
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
    </motion.div>
  );
}
