import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Play, Heart, Share2, Volume2, VolumeX, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Video as VideoType, Subscription } from "@shared/schema";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getBunnyHlsUrl, getBunnyThumbnail } from "@/components/bunny-player";
import Hls from "hls.js";


interface VideoPageProps {
  id: string;
  title: string;
  creatorName: string;
  creatorId?: string;
  displayName?: string;
  creatorAvatar?: string;
  viewCount: number;
  likeCount: number;
  duration: number;
  isActive: boolean;
  musicName?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  bunnyVideoId?: string;
  isHorizontal?: boolean;
  isPremium?: boolean;
  hasAccess?: boolean;
  requiredTier?: number;
}

function VideoPage({
  id,
  title,
  creatorName,
  creatorId,
  displayName,
  creatorAvatar,
  likeCount,
  duration,
  isActive,
  thumbnailUrl,
  videoUrl,
  bunnyVideoId,
  musicName,
  isHorizontal = false,
  isPremium = false,
  hasAccess = true,
}: VideoPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [likes, setLikes] = useState(likeCount);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [videoFit, setVideoFit] = useState<"cover" | "contain">("contain");
  const progressRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const hlsUrl = bunnyVideoId ? getBunnyHlsUrl(bunnyVideoId) : "";
  const effectiveVideoUrl = hlsUrl || videoUrl || "";
  const effectiveThumbnail = thumbnailUrl || (bunnyVideoId ? getBunnyThumbnail(bunnyVideoId) : "");
  const isHlsStream = effectiveVideoUrl.endsWith(".m3u8");

  const videoDuration = duration || 30;
  
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0], [0.5, 1]);
  
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -100 || info.velocity.x < -500) {
      animate(x, -500, { duration: 0.3 });
      setTimeout(() => {
        if (creatorId === user?.id) {
          setLocation("/my-profile");
        } else if (creatorId) {
          setLocation(`/creator/${creatorId}`);
        } else {
          setLocation(`/creator/${creatorName}`);
        }
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

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/videos/${id}/like`);
      return res.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.liked);
      setLikes(prev => data.liked ? prev + 1 : prev - 1);
      queryClient.invalidateQueries({ queryKey: ["/api/my-likes"] });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    if (videoRef.current) {
      if (newPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  // Set up HLS.js for Bunny / HLS streams
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveVideoUrl || !hasAccess) return;

    if (isHlsStream) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, backBufferLength: 30 });
        hlsRef.current = hls;
        hls.loadSource(effectiveVideoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) console.error("HLS error:", data.type, data.details);
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = effectiveVideoUrl;
      }
    } else {
      video.src = effectiveVideoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveVideoUrl, isHlsStream, hasAccess]);

  // Control video playback based on isActive
  useEffect(() => {
    if (videoRef.current && effectiveVideoUrl) {
      if (isActive && !isPaused && hasAccess) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isPaused, effectiveVideoUrl, hasAccess]);

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      if (videoWidth > 0 && videoHeight > 0) {
        setVideoFit(videoWidth > videoHeight ? "contain" : "cover");
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isDragging) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  // Reset progress when video changes
  useEffect(() => {
    if (isActive) {
      setProgress(0);
    }
  }, [isActive]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickPosition = (clientX - rect.left) / rect.width;
    const newProgress = Math.max(0, Math.min(100, clickPosition * 100));
    setProgress(newProgress);
    
    const dur = videoRef.current.duration;
    if (isFinite(dur) && dur > 0) {
      videoRef.current.currentTime = clickPosition * dur;
    }
  };

  const handleProgressDragStart = () => {
    setIsDragging(true);
  };

  const handleProgressDragEnd = () => {
    setIsDragging(false);
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      if (isFinite(dur) && dur > 0) {
        videoRef.current.currentTime = (progress / 100) * dur;
      }
    }
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const dragPosition = (clientX - rect.left) / rect.width;
    const newProgress = Math.max(0, Math.min(100, dragPosition * 100));
    setProgress(newProgress);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (creatorId === user?.id) {
      setLocation("/my-profile");
    } else if (creatorId) {
      setLocation(`/creator/${creatorId}`);
    } else {
      setLocation(`/creator/${creatorName}`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/creator/${creatorName}`;
    const shareData = {
      title: title,
      text: `${displayName || creatorName}さんのコンテンツをチェック！`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "リンクをコピーしました",
          description: "クリップボードにコピーされました",
        });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "リンクをコピーしました",
          description: "クリップボードにコピーされました",
        });
      }
    }
  };

  return (
    <motion.div 
      className="snap-start h-[100svh] w-full relative flex-shrink-0 bg-black touch-pan-y [isolation:isolate]"
      data-testid={`video-page-${id}`}
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: -200, right: 0 }}
      dragElastic={{ left: 0.5, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      {/* Video background */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={togglePause}
      >
        {/* Video or fallback image */}
        {effectiveVideoUrl && hasAccess ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleVideoMetadata}
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : effectiveThumbnail ? (
          <img 
            src={effectiveThumbnail} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
        
        {/* Play/Pause indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isPremium && !hasAccess ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="h-24 w-24 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
                <Lock className="h-12 w-12 text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg">プレミアムコンテンツ</p>
                <p className="text-white/80 text-sm">クリエイターを購読して視聴</p>
              </div>
              <Button
                onClick={() => {
                  if (creatorId === user?.id) {
                    setLocation("/my-profile");
                  } else if (creatorId) {
                    setLocation(`/creator/${creatorId}`);
                  } else {
                    setLocation(`/creator/${creatorName}`);
                  }
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6"
                data-testid="button-subscribe-premium"
              >
                本編はこちら
              </Button>
            </motion.div>
          ) : isPaused ? (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Play className="h-10 w-10 text-white ml-1" fill="white" />
            </motion.div>
          ) : null}
        </div>
        
        {/* Premium blur overlay */}
        {isPremium && !hasAccess && (
          <div className="absolute inset-0 backdrop-blur-lg" />
        )}
        
        {/* Animated shimmer effect */}
        {isActive && !isPaused && (
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 30% 70%, rgba(236,72,153,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 30%, rgba(168,85,247,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(244,63,94,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 70%, rgba(236,72,153,0.4) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        )}
        
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-[100px] z-10 flex flex-col items-center gap-5 [transform:translateZ(0)] [will-change:transform]">
        {/* Creator avatar */}
        <button
          onClick={handleAvatarClick}
          className="relative"
          data-testid={`button-avatar-${id}`}
        >
          <Avatar className="h-11 w-11 ring-2 ring-white shadow-xl">
            {creatorAvatar && <AvatarImage src={creatorAvatar} />}
            <AvatarFallback delayMs={0} className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold text-sm">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`button-like-${id}`}
        >
          <motion.div
            whileTap={{ scale: 1.3 }}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md transition-colors shadow-lg"
          >
            <Heart
              className={`h-6 w-6 transition-colors drop-shadow ${
                isLiked ? "text-pink-400 fill-pink-400" : "text-white"
              }`}
            />
          </motion.div>
          <span className="text-[11px] text-white font-bold drop-shadow" data-testid={`text-likes-${id}`}>
            {formatCount(likes)}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
          data-testid={`button-share-${id}`}
        >
          <div className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Share2 className="h-6 w-6 text-white drop-shadow" />
          </div>
          <span className="text-[11px] text-white font-bold drop-shadow">シェア</span>
        </button>

        {/* Volume */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleMute(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`button-volume-${id}`}
        >
          <div className={`h-11 w-11 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-lg ${
            isMuted ? "bg-black/40" : "bg-white/20"
          }`}>
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-white drop-shadow" />
            ) : (
              <Volume2 className="h-5 w-5 text-white drop-shadow" />
            )}
          </div>
        </button>
      </div>

      {/* Bottom content info */}
      <div className="absolute left-4 right-[68px] bottom-[104px] z-10 [transform:translateZ(0)] [will-change:transform]">
        {/* Creator name row */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-white font-bold text-[15px] drop-shadow-sm" data-testid={`text-creator-${id}`}>
            {displayName || creatorName}
          </span>
        </div>

        {/* Title/description */}
        <p className="text-white/90 text-[13px] leading-snug line-clamp-2 mb-2.5 drop-shadow-sm" data-testid={`text-title-${id}`}>
          {title}
        </p>

        {/* Music + CTA row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Premium CTA */}
          {isPremium && !hasAccess && (
            <button
              onClick={() => {
                if (creatorId === user?.id) {
                  setLocation("/my-profile");
                } else if (creatorId) {
                  setLocation(`/creator/${creatorId}`);
                } else {
                  setLocation(`/creator/${creatorName}`);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-bold shadow-lg shadow-pink-500/30"
              data-testid={`button-full-content-${id}`}
            >
              本編はこちら
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        className="absolute bottom-[72px] left-0 right-0 h-[3px] bg-white/30 cursor-pointer touch-none z-20 [transform:translateZ(0)] [will-change:transform]"
        onClick={handleProgressBarClick}
        onMouseDown={handleProgressDragStart}
        onMouseUp={handleProgressDragEnd}
        onMouseLeave={handleProgressDragEnd}
        onMouseMove={handleProgressDrag}
        onTouchStart={(e) => { handleProgressDragStart(); handleProgressBarClick(e); }}
        onTouchEnd={handleProgressDragEnd}
        onTouchMove={handleProgressDrag}
        data-testid={`progress-bar-${id}`}
      >
        <div
          className="h-full bg-gradient-to-r from-pink-400 to-rose-400 transition-none"
          style={{ width: `${progress}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg"
          style={{ left: `calc(${progress}% - 5px)` }}
        />
      </div>

    </motion.div>
  );
}


export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: recommendedVideos, isLoading: isLoadingVideos } = useQuery<any[]>({
    queryKey: ["/api/videos"],
  });

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });

  // Check if user has access to a creator's premium content based on tier
  const hasAccessToCreator = (creatorId: string, requiredTier: number = 1) => {
    if (!subscriptions) return false;
    const subscription = subscriptions.find(s => s.creatorId === creatorId);
    if (!subscription) return false;
    // Check if subscription tier meets the required tier
    return (subscription.tier || 1) >= requiredTier;
  };

  // Map API data to VideoPageProps
  const mapVideoToProps = (v: any, idx: number): VideoPageProps => {
    const requiredTier = v.requiredTier || 0;
    const isPremium = requiredTier > 0 || v.contentType === "premium";
    const hasAccess = requiredTier === 0 || hasAccessToCreator(v.creatorId, requiredTier);
    
    return {
      id: v.id,
      title: v.title,
      creatorName: v.creatorDisplayName || "Creator",
      creatorId: v.creatorId,
      displayName: v.creatorDisplayName,
      creatorAvatar: v.creatorAvatarUrl,
      viewCount: v.viewCount || 0,
      likeCount: v.likeCount || 0,
      duration: v.duration || 0,
      isPremium,
      hasAccess,
      requiredTier,
      isActive: false,
      musicName: "オリジナル音源",
      thumbnailUrl: v.thumbnailUrl,
      videoUrl: v.videoUrl,
      bunnyVideoId: v.bunnyVideoId,
    };
  };

  const displayVideos: VideoPageProps[] = isLoadingVideos
    ? []
    : (recommendedVideos || []).map(mapVideoToProps);

  // Track scroll position to determine active video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < displayVideos.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, displayVideos.length]);

  return (
    <>
      <Header variant="overlay" />
      <div className="h-[100svh] bg-black overflow-hidden">
        {isLoadingVideos ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 text-sm">コンテンツを読み込み中...</p>
            </div>
          </div>
        ) : displayVideos.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-950 to-black">
            <div className="flex flex-col items-center gap-4 px-8 text-center">
              <h2 className="text-white font-bold text-xl">まだ動画がありません</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                クリエイターがコンテンツを投稿すると<br />ここに表示されます。
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
            data-testid="video-feed"
          >
            {displayVideos.map((video, index) => (
              <VideoPage
                key={video.id}
                {...video}
                isActive={index === activeIndex}
              />
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </>
  );
}
