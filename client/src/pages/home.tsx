import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Play, Heart, MessageCircle, Share2, Plus, Crown, Volume2, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Video as VideoType, Subscription } from "@shared/schema";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// AI-generated explicit images for 18+ adult content
import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/lingerie_bed_3.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/bunny_girl_5.jpg";
import img6 from "@assets/generated_images/micro_bikini_6.jpg";
import img7 from "@assets/generated_images/sexy_maid_7.jpg";
import img8 from "@assets/generated_images/topless_morning_8.jpg";
import imgHorizontal from "@assets/generated_images/horizontal_glamour_sofa_scene.png";

interface VideoPageProps {
  id: string;
  title: string;
  creatorName: string;
  displayName?: string;
  creatorAvatar?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: number;
  isActive: boolean;
  musicName?: string;
  thumbnailUrl?: string;
  isHorizontal?: boolean;
  isPremium?: boolean;
  hasAccess?: boolean;
}

function VideoPage({
  id,
  title,
  creatorName,
  displayName,
  creatorAvatar,
  likeCount,
  commentCount,
  isActive,
  thumbnailUrl,
  isHorizontal = false,
  isPremium = false,
  hasAccess = true,
}: VideoPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [likes, setLikes] = useState(likeCount);
  const [, setLocation] = useLocation();
  
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
    if (isLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <motion.div 
      className="snap-start h-[100svh] w-full relative flex-shrink-0 bg-black touch-pan-y"
      data-testid={`video-page-${id}`}
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: -200, right: 0 }}
      dragElastic={{ left: 0.5, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      {/* Video background with image */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={togglePause}
      >
        {/* Background image */}
        {thumbnailUrl && (
          <img 
            src={thumbnailUrl} 
            alt="" 
            className={`absolute inset-0 w-full h-full ${isHorizontal ? "object-contain" : "object-cover"}`}
          />
        )}
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        
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
                onClick={() => setLocation(`/creator/${creatorName}`)}
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
      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-4">
        {/* Creator avatar */}
        <div className="relative mb-1">
          <Avatar className="h-11 w-11 ring-2 ring-white shadow-lg">
            <AvatarImage src={creatorAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-pink-500 hover:bg-pink-600 border-0 shadow-lg"
            data-testid={`button-follow-${id}`}
          >
            <Plus className="h-3 w-3 text-white" />
          </Button>
        </div>

        {/* Like */}
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
          <span className="text-[10px] text-white font-semibold" data-testid={`text-likes-${id}`}>
            {formatCount(likes)}
          </span>
        </button>

        {/* Comment */}
        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-comment-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">{formatCount(commentCount)}</span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-share-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">シェア</span>
        </button>

        {/* Volume */}
        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-volume-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Volume2 className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>

      {/* Bottom content info */}
      <div className="absolute left-4 right-20 bottom-28 z-10 space-y-3">
        {/* Creator name */}
        <div className="flex flex-col">
          <span className="text-white font-bold text-base" data-testid={`text-creator-${id}`}>
            {displayName || creatorName}
          </span>
          <span className="text-white/70 text-sm">
            @{creatorName}
          </span>
        </div>

        {/* Title/description */}
        <p className="text-white text-sm leading-relaxed line-clamp-2" data-testid={`text-title-${id}`}>
          {title}
        </p>

        {/* Full content CTA */}
        <button
          onClick={() => setLocation(`/creator/${creatorName}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold shadow-lg shadow-pink-500/30 w-fit"
          data-testid={`button-full-content-${id}`}
        >
          <Crown className="h-4 w-4" />
          本編はこちら
        </button>
      </div>

      {/* Progress bar */}
      {isActive && (
        <motion.div
          className="absolute bottom-24 left-0 right-0 h-0.5 bg-white/20"
        >
          <motion.div
            className="h-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 15, ease: "linear", repeat: Infinity }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

// Adult content mock data for 18+ platform with AI-generated images
const demoVideos: VideoPageProps[] = [
  {
    id: "demo-1",
    title: "深夜のランジェリー配信💋 今夜はどこまで見せる？ #18禁 #下着",
    creatorName: "Risa",
    displayName: "りさ💋",
    viewCount: 285000,
    likeCount: 24800,
    commentCount: 1890,
    duration: 45,
    isActive: false,
    musicName: "Midnight Jazz - Lounge Mix",
    thumbnailUrl: img1,
  },
  {
    id: "demo-2",
    title: "ベッドルームからお届け🖤 シルクローブで誘惑...寝室の秘密 #寝室配信",
    creatorName: "Yua",
    displayName: "ゆあ🖤",
    viewCount: 456000,
    likeCount: 38200,
    commentCount: 2340,
    duration: 60,
    isActive: false,
    musicName: "Sensual R&B Mix",
    thumbnailUrl: img2,
  },
  {
    id: "demo-3",
    title: "お風呂配信🛁 泡で隠れてる？ギリギリを攻めます #入浴 #セクシー",
    creatorName: "Mio",
    displayName: "みお🛁",
    viewCount: 189000,
    likeCount: 15600,
    commentCount: 890,
    duration: 35,
    isActive: false,
    musicName: "Ambient Relaxation",
    thumbnailUrl: img3,
  },
  {
    id: "demo-4",
    title: "バニーガール登場🐰 ご主人様のために...リクエスト受付中 #コスプレ #バニー",
    creatorName: "Reina",
    displayName: "れいな🐰",
    viewCount: 523000,
    likeCount: 42000,
    commentCount: 3100,
    duration: 55,
    isActive: false,
    musicName: "Tokyo Night Vibes",
    thumbnailUrl: img4,
  },
  {
    id: "demo-5",
    title: "マイクロビキニ撮影会📸 際どすぎて放送ギリギリ！？ #水着 #グラビア",
    creatorName: "Hina",
    displayName: "ひな📸",
    viewCount: 612000,
    likeCount: 51000,
    commentCount: 4200,
    duration: 50,
    isActive: false,
    musicName: "Summer Beach House",
    thumbnailUrl: img5,
  },
  {
    id: "demo-6",
    title: "添い寝ASMR💕 耳舐め＆吐息責め...イヤホン推奨 #ASMR #耳舐め",
    creatorName: "Saki",
    displayName: "さき💕",
    viewCount: 178000,
    likeCount: 13400,
    commentCount: 780,
    duration: 40,
    isActive: false,
    musicName: "Lo-fi Chill Beats",
    thumbnailUrl: img6,
  },
  {
    id: "demo-7",
    title: "ノーブラ配信🔞 薄着でゴロゴロ...見えちゃうかも？ #ノーブラ #チラ見え",
    creatorName: "Aya",
    displayName: "あや🔞",
    viewCount: 398000,
    likeCount: 32000,
    commentCount: 2800,
    duration: 45,
    isActive: false,
    musicName: "Kawaii EDM Mix",
    thumbnailUrl: img7,
  },
  {
    id: "demo-8",
    title: "メイドコス配信🎀 ご主人様のお帰りをお待ちしてます #メイド #エロコス",
    creatorName: "Nana",
    displayName: "なな🎀",
    viewCount: 445000,
    likeCount: 36500,
    commentCount: 2650,
    duration: 50,
    isActive: false,
    musicName: "Kawaii Pop Mix",
    thumbnailUrl: img8,
  },
  {
    id: "demo-9",
    title: "ソファでくつろぎ配信💫 リラックスした姿をお届け #横型 #グラビア",
    creatorName: "Mei",
    displayName: "めい💫",
    viewCount: 234000,
    likeCount: 19800,
    commentCount: 1520,
    duration: 55,
    isActive: false,
    musicName: "Chill Lounge Mix",
    thumbnailUrl: imgHorizontal,
    isHorizontal: true,
  },
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedType, setFeedType] = useState<"recommend" | "following">("recommend");
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: videos } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  const { data: subscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });

  const subscribedCreatorIds = subscriptions?.map(s => s.creatorId) || [];

  // Following videos (fewer, simulating followed creators)
  const followingVideos = demoVideos.filter((_, i) => i % 2 === 0);

  // Check if user has access to a creator's premium content
  const hasAccessToCreator = (creatorId: string) => {
    return subscribedCreatorIds.includes(creatorId);
  };

  // Use API data when available, fallback to demo data for showcase
  const displayVideos: VideoPageProps[] = feedType === "following" 
    ? followingVideos
    : videos && videos.length > 0
      ? videos.map((v, idx) => ({
          id: v.id,
          title: v.title,
          creatorName: v.creatorId?.slice(0, 8) || "Creator",
          viewCount: v.viewCount || 0,
          likeCount: v.likeCount || 0,
          commentCount: 0,
          duration: v.duration || 0,
          isPremium: v.contentType === "premium",
          hasAccess: v.contentType !== "premium" || hasAccessToCreator(v.creatorId),
          isActive: false,
          musicName: "オリジナル音源",
          thumbnailUrl: v.thumbnailUrl || demoVideos[idx % demoVideos.length]?.thumbnailUrl,
        }))
      : demoVideos;

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
      <BottomNavigation />
    </>
  );
}
