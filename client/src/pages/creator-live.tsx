import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Radio, 
  Play, 
  Square, 
  Users,
  Clock,
  Trash2,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RotateCcw,
  X,
  MessageCircle,
  Gift,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LiveStream } from "@shared/schema";

export default function CreatorLive() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
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
          width: { ideal: 1280 },
          height: { ideal: 720 }
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
    if (facingMode && isStreaming) {
      startCamera();
    }
  }, [facingMode, isStreaming, startCamera]);

  useEffect(() => {
    if (isStreaming) {
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
  }, [isStreaming]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startLiveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const response = await apiRequest("POST", "/api/live", {
        ...data,
        status: "live",
      });
      return response.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setIsDialogOpen(false);
      setCurrentStreamId(data.id);
      setIsStreaming(true);
      setViewerCount(Math.floor(Math.random() * 10) + 1);
      await startCamera();
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
      setIsStreaming(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast({ title: "タイトルを入力してください", variant: "destructive" });
      return;
    }
    startLiveMutation.mutate(form);
  };

  const handleEndStream = () => {
    if (currentStreamId) {
      endLiveMutation.mutate(currentStreamId);
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

  const pastStreams = myLiveStreams?.filter(s => s.status !== "live") || [];

  if (isStreaming) {
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

        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 rounded-full">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-bold">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 rounded-full">
                <Users className="h-4 w-4 text-white" />
                <span className="text-white text-sm">{viewerCount}</span>
              </div>
              <div className="px-3 py-1.5 bg-black/50 rounded-full">
                <span className="text-white text-sm">{formatDuration(streamDuration)}</span>
              </div>
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
          <h2 className="text-white font-bold mt-2 text-lg">{form.title}</h2>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <Button
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={toggleCamera}
            data-testid="button-toggle-camera"
          >
            {isCameraOn ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={toggleMic}
            data-testid="button-toggle-mic"
          >
            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={switchCamera}
            data-testid="button-switch-camera"
          >
            <RotateCcw className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <Input
                placeholder="コメントを送信..."
                className="bg-black/50 border-white/30 text-white placeholder:text-white/50 pr-24"
                data-testid="input-comment"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70">
                  <Gift className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-pink-500 hover:bg-pink-600"
            onClick={handleEndStream}
            disabled={endLiveMutation.isPending}
            data-testid="button-end-live"
          >
            <Square className="h-4 w-4 mr-2" />
            {endLiveMutation.isPending ? "終了中..." : "配信を終了"}
          </Button>
        </div>

        <div className="absolute left-4 bottom-32 max-h-40 overflow-y-auto space-y-2">
          <div className="flex items-start gap-2 bg-black/40 rounded-lg px-3 py-2 max-w-[250px]">
            <div className="h-6 w-6 rounded-full bg-pink-500 flex-shrink-0" />
            <div>
              <span className="text-white/80 text-xs">ユーザー1</span>
              <p className="text-white text-sm">配信ありがとう！</p>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-black/40 rounded-lg px-3 py-2 max-w-[250px]">
            <div className="h-6 w-6 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <span className="text-white/80 text-xs">ユーザー2</span>
              <p className="text-white text-sm">こんにちは！</p>
            </div>
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
          <p className="text-sm text-muted-foreground mb-6">
            カメラを使ってリアルタイムでフォロワーに配信しましょう
          </p>
          <Button
            size="lg"
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            data-testid="button-start-live"
          >
            <Camera className="h-5 w-5 mr-2" />
            配信を開始
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ライブ配信を開始</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="配信のタイトル"
                data-testid="input-title"
              />
            </div>
            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="配信の説明"
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-pink-500 hover:bg-pink-600"
                disabled={startLiveMutation.isPending}
                data-testid="button-submit"
              >
                <Camera className="h-4 w-4 mr-2" />
                {startLiveMutation.isPending ? "開始中..." : "配信開始"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-24" />
    </motion.div>
  );
}
