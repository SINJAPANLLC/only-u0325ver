import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Radio, Users, Heart, Share2, Volume2, VolumeX, UserRound, UsersRound, Clock, Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { LiveStream } from "@shared/schema";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { useWebRTC } from "@/hooks/use-webrtc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RoomMode = "waiting" | "party" | "twoshot";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/lingerie_bed_3.jpg";
import img3 from "@assets/generated_images/bunny_girl_5.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/sexy_maid_7.jpg";

interface LiveStreamPageProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  creatorName: string;
  displayName?: string;
  creatorAvatar?: string;
  viewerCount: number;
  likeCount: number;
  isLive: boolean;
  category?: string;
  isActive: boolean;
  partyRatePerMinute: number;
  twoshotRatePerMinute: number;
  userPoints: number;
  currentMode: RoomMode;
  onModeChange: (mode: RoomMode) => void;
  isRealStream?: boolean;
}

function LiveStreamPage({
  id,
  title,
  thumbnailUrl,
  creatorName,
  displayName,
  creatorAvatar,
  viewerCount,
  likeCount,
  isLive,
  category,
  isActive,
  partyRatePerMinute,
  twoshotRatePerMinute,
  userPoints,
  currentMode,
  onModeChange,
  isRealStream = false,
}: LiveStreamPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(likeCount);
  const [, setLocation] = useLocation();
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<RoomMode | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [comment, setComment] = useState("");
  const [flowingComments, setFlowingComments] = useState<{id: number; text: string; username: string}[]>([]);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleStreamReceived = useCallback((stream: MediaStream | null) => {
    setRemoteStream(stream);
    setIsConnecting(false);
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, []);

  const webrtc = useWebRTC({
    streamId: id,
    isBroadcaster: false,
    onStreamReceived: handleStreamReceived,
  });

  useEffect(() => {
    if (isRealStream && isActive) {
      setIsConnecting(true);
      webrtc.joinAsViewer();
    }
    return () => {
      if (isRealStream) {
        webrtc.stopViewing();
      }
    };
  }, [isRealStream, isActive]);

  useEffect(() => {
    if (remoteStream && videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (currentMode !== "waiting" && isActive) {
      const timer = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentMode, isActive]);

  const handleModeRequest = (mode: RoomMode) => {
    if (mode === "waiting") {
      onModeChange("waiting");
      setSessionTime(0);
    } else {
      setPendingMode(mode);
      setShowModeDialog(true);
    }
  };

  const confirmModeChange = () => {
    if (pendingMode) {
      onModeChange(pendingMode);
      setSessionTime(0);
    }
    setShowModeDialog(false);
    setPendingMode(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentRate = currentMode === "party" ? partyRatePerMinute : currentMode === "twoshot" ? twoshotRatePerMinute : 0;
  const estimatedCost = Math.floor(sessionTime / 60) * currentRate;

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0], [0.5, 1]);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -100 || info.velocity.x < -500) {
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => {
        setLocation(`/creator/${creatorName}`);
      }, 250);
    } else {
      animate(x, 0, { duration: 0.2 });
    }
  };

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleLike = () => {
    if (!isLiked) {
      setLocalLikes(prev => prev + 1);
    } else {
      setLocalLikes(prev => prev - 1);
    }
    setIsLiked(!isLiked);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/live/${id}`;
    const shareData = {
      title: `${displayName || creatorName}のライブ配信`,
      text: title,
      url: shareUrl,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    
    const newComment = {
      id: Date.now(),
      text: comment,
      username: "あなた",
    };
    
    setFlowingComments(prev => [...prev, newComment]);
    setComment("");
    
    setTimeout(() => {
      setFlowingComments(prev => prev.filter(c => c.id !== newComment.id));
    }, 5000);
  };

  return (
    <motion.div 
      className="snap-start h-[100svh] w-full relative flex-shrink-0 bg-black touch-pan-y"
      data-testid={`live-stream-${id}`}
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: -200, right: 0 }}
      dragElastic={{ left: 0.5, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      {isRealStream && remoteStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-pink-600 to-rose-700" />
      )}

      {isRealStream && isConnecting && !remoteStream && (
        <div className="absolute inset-0 z-10">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt="接続中"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-rose-900 via-pink-800 to-rose-950" />
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2" />
              <p className="text-sm">配信に接続中...</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="absolute top-24 left-4 right-4 z-20">
        <div className="flex items-center justify-between gap-1">
          <div className={`flex items-center gap-1 text-[10px] font-bold ${
            currentMode === "party" ? "text-pink-400" : currentMode === "twoshot" ? "text-purple-400" : "text-white"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
              currentMode === "party" ? "bg-pink-400" : currentMode === "twoshot" ? "bg-purple-400" : "bg-pink-500"
            }`} />
            {currentMode === "waiting" ? "待機中" : currentMode === "party" ? "パーティー中" : "2ショット中"}
          </div>
          <div className="flex items-center gap-1 text-white text-[10px] font-medium">
            <Users className="h-3 w-3" />
            {formatCount(viewerCount)}
          </div>
          {currentMode !== "waiting" && (
            <div className="flex items-center gap-1 text-white text-[10px] font-medium">
              <Clock className="h-3 w-3" />
              {formatTime(sessionTime)}
            </div>
          )}
          <button
            onClick={() => handleModeRequest(currentMode === "party" ? "waiting" : "party")}
            className={`flex items-center gap-1 text-[10px] font-medium px-3 py-1 rounded-full ${
              currentMode === "party" 
                ? "bg-pink-600 text-white" 
                : "bg-pink-500 text-white"
            }`}
            data-testid="button-party-mode"
          >
            <UsersRound className="h-3 w-3" />
            パーティー
          </button>
          <button
            onClick={() => handleModeRequest(currentMode === "twoshot" ? "waiting" : "twoshot")}
            className={`flex items-center gap-1 text-[10px] font-medium px-3 py-1 rounded-full ${
              currentMode === "twoshot" 
                ? "bg-pink-600 text-white" 
                : "bg-pink-500 text-white"
            }`}
            data-testid="button-twoshot-mode"
          >
            <UserRound className="h-3 w-3" />
            2ショット
          </button>
          <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold" data-testid="badge-points">
            {userPoints.toLocaleString()}ポイント
          </div>
        </div>
        {currentMode !== "waiting" && (
          <div className="flex justify-end mt-1">
            <span className="text-[9px] text-white/80">
              {currentRate}pt/分
            </span>
          </div>
        )}
      </div>

      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="max-w-[320px] bg-white border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-foreground">
              {pendingMode === "party" ? "パーティー" : "2ショット"}に入室
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              入室すると1分ごとにポイントが消費されます
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between items-center bg-muted rounded-lg px-4 py-3">
              <span className="text-sm text-foreground">料金</span>
              <span className="font-bold text-pink-500">
                {pendingMode === "party" ? partyRatePerMinute : twoshotRatePerMinute}pt/分
              </span>
            </div>
            <div className="flex justify-between items-center bg-muted rounded-lg px-4 py-3">
              <span className="text-sm text-foreground">持ちポイント</span>
              <span className="font-bold text-amber-500">{userPoints.toLocaleString()}pt</span>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowModeDialog(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button 
              onClick={confirmModeChange}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
              data-testid="button-confirm-mode"
            >
              入室する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-4">
        <div className="mb-1">
          <Avatar className="h-11 w-11 ring-2 ring-pink-500 shadow-lg">
            <AvatarImage src={creatorAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-pink-600 text-white font-bold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          data-testid={`button-like-${id}`}
        >
          <motion.div
            whileTap={{ scale: 1.3 }}
            className={`h-9 w-9 rounded-full flex items-center justify-center ${
              isLiked ? "bg-pink-500/20" : "bg-white/10"
            } backdrop-blur-sm transition-colors`}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isLiked ? "text-pink-500 fill-pink-500" : "text-white"
              }`}
            />
          </motion.div>
          <span className="text-[10px] text-white font-semibold">
            {formatCount(localLikes)}
          </span>
        </button>

        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
          data-testid={`button-share-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">シェア</span>
        </button>

        <button
          onClick={handleToggleMute}
          className="flex flex-col items-center gap-1"
          data-testid={`button-volume-${id}`}
        >
          <div className={`h-9 w-9 rounded-full ${isMuted ? "bg-pink-500/20" : "bg-white/10"} backdrop-blur-sm flex items-center justify-center`}>
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-pink-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </div>
        </button>
      </div>

      <div className="absolute left-4 right-20 bottom-36 z-10 space-y-2">
        <div className="flex flex-col">
          <span className="text-white font-bold text-base" data-testid={`text-creator-${id}`}>
            {displayName || creatorName}
          </span>
          <span className="text-white/70 text-sm">
            @{creatorName}
          </span>
        </div>

        <p className="text-white text-sm leading-relaxed line-clamp-2" data-testid={`text-live-title-${id}`}>
          {title}
        </p>

      </div>

      {currentMode !== "waiting" && (
        <>
          <div className="absolute left-4 right-4 bottom-44 z-20 pointer-events-none">
            <div className="space-y-2">
              {flowingComments.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm">
                    <span className="text-pink-400 font-medium mr-1">{c.username}</span>
                    {c.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute left-4 right-16 bottom-24 z-20">
            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
                placeholder="コメントを入力..."
                className="flex-1 bg-transparent border-0 text-white placeholder:text-white/50 text-sm h-7 focus-visible:ring-0"
                data-testid="input-comment"
              />
              <Button
                size="icon"
                onClick={handleSendComment}
                className="h-7 w-7 rounded-full bg-pink-500 hover:bg-pink-600"
                data-testid="button-send-comment"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </Button>
            </div>
          </div>
        </>
      )}

    </motion.div>
  );
}

interface DemoStreamData {
  id: string;
  title: string;
  creatorName: string;
  displayName?: string;
  viewerCount: number;
  likeCount: number;
  isLive: boolean;
  category?: string;
  thumbnailUrl: string;
  partyRatePerMinute: number;
  twoshotRatePerMinute: number;
}

const demoLiveStreams: DemoStreamData[] = [
  {
    id: "live-1",
    title: "【18禁】脱衣リクエスト配信💋 どんどん脱ぐよ",
    creatorName: "Reina",
    displayName: "れいな💋",
    viewerCount: 2450,
    likeCount: 18500,
    isLive: true,
    category: "脱衣",
    thumbnailUrl: img1,
    partyRatePerMinute: 50,
    twoshotRatePerMinute: 200,
  },
  {
    id: "live-2",
    title: "透けブラ＆Tバック試着会🖤 全部見せちゃう",
    creatorName: "Yua",
    displayName: "ゆあ🖤",
    viewerCount: 1890,
    likeCount: 15200,
    isLive: true,
    category: "下着",
    thumbnailUrl: img2,
    partyRatePerMinute: 40,
    twoshotRatePerMinute: 150,
  },
  {
    id: "live-3",
    title: "バニーガール配信🐰 今夜はご主人様のために何でもします",
    creatorName: "Mio",
    displayName: "みお🐰",
    viewerCount: 1250,
    likeCount: 9800,
    isLive: true,
    category: "コスプレ",
    thumbnailUrl: img3,
    partyRatePerMinute: 30,
    twoshotRatePerMinute: 120,
  },
  {
    id: "live-4",
    title: "シャワー配信💦 全身見せちゃうかも...？",
    creatorName: "Hina",
    displayName: "ひな💦",
    viewerCount: 3200,
    likeCount: 24500,
    isLive: true,
    category: "入浴",
    thumbnailUrl: img4,
    partyRatePerMinute: 60,
    twoshotRatePerMinute: 250,
  },
  {
    id: "live-5",
    title: "メイドコス配信🎀 ご主人様のリクエストに全部応えます",
    creatorName: "Saki",
    displayName: "さき🎀",
    viewerCount: 1680,
    likeCount: 12300,
    isLive: true,
    category: "メイド",
    thumbnailUrl: img5,
    partyRatePerMinute: 35,
    twoshotRatePerMinute: 140,
  },
];

export default function Live() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedType, setFeedType] = useState<"recommend" | "following">("recommend");
  const [roomModes, setRoomModes] = useState<Record<string, RoomMode>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: liveStreams } = useQuery<any[]>({
    queryKey: ["/api/live/active"],
    refetchInterval: 5000,
  });

  const { data: userProfile } = useQuery<any>({
    queryKey: ["/api/profile"],
  });

  const userPoints = userProfile?.points || 0;

  const followingStreams = demoLiveStreams.filter((_, i) => i % 2 === 0);

  const realLiveStreamsFormatted = (liveStreams || []).map((s: any, idx) => ({
    id: s.id,
    title: s.title,
    thumbnailUrl: s.thumbnailUrl || demoLiveStreams[idx % demoLiveStreams.length]?.thumbnailUrl,
    creatorName: s.creatorDisplayName || "Creator",
    displayName: s.creatorDisplayName || s.title,
    creatorAvatar: s.creatorAvatar,
    viewerCount: s.viewerCount || 0,
    likeCount: s.likeCount || 0,
    isLive: s.status === "live",
    category: "LIVE配信中",
    partyRatePerMinute: s.partyRatePerMinute || 50,
    twoshotRatePerMinute: s.twoshotRatePerMinute || 200,
    isRealStream: true,
  }));

  const baseStreams = feedType === "following"
    ? followingStreams
    : realLiveStreamsFormatted.length > 0
      ? realLiveStreamsFormatted
      : demoLiveStreams;

  const handleModeChange = (streamId: string, mode: RoomMode) => {
    setRoomModes(prev => ({ ...prev, [streamId]: mode }));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < baseStreams.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, baseStreams.length]);

  const handleFeedTypeChange = (type: "recommend" | "following") => {
    setFeedType(type);
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Header 
        feedType={feedType} 
        onFeedTypeChange={handleFeedTypeChange}
        showFeedTabs={true}
      />
      <div 
        ref={containerRef}
        className="h-[100svh] overflow-y-scroll snap-y snap-mandatory hide-scrollbar bg-black"
        data-testid="live-feed-container"
      >
        {baseStreams.map((stream, index) => (
          <LiveStreamPage
            key={stream.id}
            id={stream.id}
            title={stream.title}
            thumbnailUrl={stream.thumbnailUrl}
            creatorName={stream.creatorName}
            displayName={stream.displayName}
            viewerCount={stream.viewerCount}
            likeCount={stream.likeCount}
            isLive={stream.isLive}
            category={stream.category}
            isActive={index === activeIndex}
            partyRatePerMinute={stream.partyRatePerMinute}
            twoshotRatePerMinute={stream.twoshotRatePerMinute}
            userPoints={userPoints}
            currentMode={roomModes[stream.id] || "waiting"}
            onModeChange={(mode) => handleModeChange(stream.id, mode)}
            isRealStream={"isRealStream" in stream && stream.isRealStream}
          />
        ))}
      </div>
      <BottomNavigation />
    </>
  );
}
