import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Heart, MessageCircle, Share2, Plus, Music2, Crown, Lock } from "lucide-react";
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
  gradientColors?: string;
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
  gradientColors = "from-pink-900/80 via-purple-900/60 to-black",
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
        className={`absolute inset-0 bg-gradient-to-br ${gradientColors} cursor-pointer`}
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
            className="absolute inset-0 opacity-40"
            animate={{
              background: [
                "radial-gradient(circle at 30% 70%, rgba(236,72,153,0.5) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 30%, rgba(168,85,247,0.5) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(244,63,94,0.5) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 70%, rgba(236,72,153,0.5) 0%, transparent 50%)",
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

      {/* Lock overlay for premium content preview */}
      {isPremium && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <p className="text-white/90 text-sm font-medium">サブスク限定コンテンツ</p>
          <Button size="sm" className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 border-0 text-white font-semibold">
            今すぐ登録
          </Button>
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
          <span className="px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-300 text-xs font-medium">
            認証済み
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

// Adult content mock data for 18+ platform
const demoVideos: VideoPageProps[] = [
  {
    id: "demo-1",
    title: "深夜のプライベートトーク💋 今夜だけの秘密の時間...メンバー限定で特別な姿をお見せします #大人の時間 #セクシー",
    creatorName: "Risa",
    viewCount: 285000,
    likeCount: 24800,
    commentCount: 1890,
    duration: 45,
    isPremium: true,
    isActive: false,
    musicName: "Midnight Jazz - Lounge Mix",
    gradientColors: "from-rose-900/90 via-pink-900/70 to-black",
  },
  {
    id: "demo-2",
    title: "新作ランジェリーの着用レビュー🖤 大人のセクシーを追求した最新コレクション #ランジェリー #下着",
    creatorName: "Yua",
    viewCount: 456000,
    likeCount: 38200,
    commentCount: 2340,
    duration: 60,
    isPremium: true,
    isActive: false,
    musicName: "Sensual R&B Mix",
    gradientColors: "from-purple-900/90 via-pink-900/70 to-black",
  },
  {
    id: "demo-3",
    title: "バスタイムASMR🛁 リラックスした夜のひととき...囁き声でお話しします #ASMR #癒し",
    creatorName: "Mio",
    viewCount: 189000,
    likeCount: 15600,
    commentCount: 890,
    duration: 35,
    isPremium: false,
    isActive: false,
    musicName: "Ambient Relaxation",
    gradientColors: "from-blue-900/80 via-purple-900/60 to-black",
  },
  {
    id: "demo-4",
    title: "銀座ホステスの夜のメイク術💄 男性を虜にする大人の色気メイク完全版 #銀座 #ホステス",
    creatorName: "Reina",
    viewCount: 523000,
    likeCount: 42000,
    commentCount: 3100,
    duration: 55,
    isPremium: true,
    isActive: false,
    musicName: "Tokyo Night Vibes",
    gradientColors: "from-amber-900/80 via-rose-900/60 to-black",
  },
  {
    id: "demo-5",
    title: "ベッドルームからこんばんは🌙 パジャマ姿でまったり雑談...今夜は何を話そうかな #おやすみ配信",
    creatorName: "Hina",
    viewCount: 178000,
    likeCount: 13400,
    commentCount: 780,
    duration: 40,
    isPremium: false,
    isActive: false,
    musicName: "Lo-fi Chill Beats",
    gradientColors: "from-indigo-900/80 via-purple-900/60 to-black",
  },
  {
    id: "demo-6",
    title: "水着グラビア撮影の裏側📸 ビーチでのセクシーショット撮影に密着！ #グラビア #水着",
    creatorName: "Saki",
    viewCount: 612000,
    likeCount: 51000,
    commentCount: 4200,
    duration: 50,
    isPremium: true,
    isActive: false,
    musicName: "Summer Beach House",
    gradientColors: "from-cyan-900/80 via-pink-900/60 to-black",
  },
  {
    id: "demo-7",
    title: "コスプレ撮影会🎀 ナース服でちょっとセクシーに...リクエストにお応えします #コスプレ #ナース",
    creatorName: "Aya",
    viewCount: 398000,
    likeCount: 32000,
    commentCount: 2800,
    duration: 45,
    isPremium: true,
    isActive: false,
    musicName: "Kawaii EDM Mix",
    gradientColors: "from-pink-900/90 via-red-900/60 to-black",
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
