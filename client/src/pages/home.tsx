import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Heart, MessageCircle, Share2, Plus, Music2, Crown, Pause } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Video as VideoType } from "@shared/schema";

interface VideoPageProps {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: number;
  isPremium?: boolean;
  isActive: boolean;
  musicName?: string;
}

function VideoPage({
  id,
  title,
  creatorName,
  creatorAvatar,
  likeCount,
  commentCount,
  isPremium,
  isActive,
  musicName = "オリジナル音源",
}: VideoPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [likes, setLikes] = useState(likeCount);

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
    <div 
      className="snap-start h-[100svh] w-full relative flex-shrink-0 bg-black"
      data-testid={`video-page-${id}`}
    >
      {/* Video background with gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-pink-900/80 via-purple-900/60 to-black cursor-pointer"
        onClick={togglePause}
      >
        {/* Simulated video content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isPaused && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Play className="h-10 w-10 text-white ml-1" fill="white" />
            </motion.div>
          )}
        </div>
        
        {/* Animated gradient background for demo */}
        {isActive && !isPaused && (
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "radial-gradient(circle at 20% 80%, rgba(236,72,153,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 20%, rgba(168,85,247,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(236,72,153,0.4) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 80%, rgba(236,72,153,0.4) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Premium badge */}
      {isPremium && (
        <div className="absolute top-20 left-4 z-10">
          <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-lg">
            <Crown className="h-3.5 w-3.5" />
            Premium
          </div>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-5">
        {/* Creator avatar */}
        <div className="relative">
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-pink-500 hover:bg-pink-600 border-0 shadow-lg"
            data-testid={`button-follow-${id}`}
          >
            <Plus className="h-3.5 w-3.5 text-white" />
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
            className={`h-12 w-12 rounded-full flex items-center justify-center ${
              isLiked ? "bg-pink-500/20" : "bg-white/10"
            } backdrop-blur-sm transition-colors`}
          >
            <Heart
              className={`h-7 w-7 transition-colors ${
                isLiked ? "text-pink-500 fill-pink-500" : "text-white"
              }`}
            />
          </motion.div>
          <span className="text-xs text-white font-semibold" data-testid={`text-likes-${id}`}>
            {formatCount(likes)}
          </span>
        </button>

        {/* Comment */}
        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-comment-${id}`}
        >
          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <span className="text-xs text-white font-semibold">{formatCount(commentCount)}</span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-share-${id}`}
        >
          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs text-white font-semibold">シェア</span>
        </button>

        {/* Music disc animation */}
        <motion.div
          animate={{ rotate: isActive && !isPaused ? 360 : 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-700 flex items-center justify-center shadow-lg"
        >
          <div className="h-4 w-4 rounded-full bg-gray-600" />
        </motion.div>
      </div>

      {/* Bottom content info */}
      <div className="absolute left-4 right-20 bottom-28 z-10 space-y-3">
        {/* Creator name */}
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-base" data-testid={`text-creator-${id}`}>
            @{creatorName}
          </span>
        </div>

        {/* Title/description */}
        <p className="text-white text-sm leading-relaxed line-clamp-2" data-testid={`text-title-${id}`}>
          {title}
        </p>

        {/* Music info */}
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-white" />
          <div className="overflow-hidden">
            <motion.p
              animate={{ x: isActive ? [0, -100, 0] : 0 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="text-white/80 text-sm whitespace-nowrap"
            >
              {musicName}
            </motion.p>
          </div>
        </div>
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
    </div>
  );
}

// Demo data for UI showcase
const demoVideos: VideoPageProps[] = [
  {
    id: "demo-1",
    title: "今日のコーデを紹介するよ！春の新作アイテムでおしゃれに決めてみた✨ #ファッション #春コーデ",
    creatorName: "Yuki",
    viewCount: 125000,
    likeCount: 8900,
    commentCount: 234,
    duration: 30,
    isPremium: false,
    isActive: false,
    musicName: "オリジナル音源 - Yuki",
  },
  {
    id: "demo-2",
    title: "モーニングルーティン💄朝のスキンケアとメイクの全工程を見せちゃいます",
    creatorName: "Sakura",
    viewCount: 450000,
    likeCount: 32000,
    commentCount: 1200,
    duration: 60,
    isPremium: true,
    isActive: false,
    musicName: "Chill Morning Vibes",
  },
  {
    id: "demo-3",
    title: "表参道の隠れ家カフェ発見！雰囲気最高すぎた☕️",
    creatorName: "Miki",
    viewCount: 89000,
    likeCount: 5600,
    commentCount: 189,
    duration: 45,
    isPremium: false,
    isActive: false,
    musicName: "Cafe Jazz BGM",
  },
  {
    id: "demo-4",
    title: "韓国コスメの新作レビュー！正直な感想言います💄",
    creatorName: "Rina",
    viewCount: 230000,
    likeCount: 18000,
    commentCount: 890,
    duration: 55,
    isPremium: true,
    isActive: false,
    musicName: "K-Pop Hits",
  },
  {
    id: "demo-5",
    title: "週末の過ごし方Vlog🌸彼氏とデートしてきた",
    creatorName: "Hana",
    viewCount: 156000,
    likeCount: 9800,
    commentCount: 445,
    duration: 40,
    isPremium: false,
    isActive: false,
    musicName: "Sweet Love Song",
  },
];

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  // Use demo data for UI showcase
  const displayVideos: VideoPageProps[] = videos && videos.length > 0
    ? videos.map(v => ({
        id: v.id,
        title: v.title,
        creatorName: "Creator",
        viewCount: v.viewCount || 0,
        likeCount: v.likeCount || 0,
        commentCount: 0,
        duration: v.duration || 0,
        isPremium: v.contentType === "premium",
        isActive: false,
        musicName: "オリジナル音源",
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

  return (
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
  );
}
