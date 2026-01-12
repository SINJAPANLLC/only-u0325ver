import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Radio, Users, Heart, MessageCircle, Share2, Gift, Plus, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { LiveStream } from "@shared/schema";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";

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
  giftCount: number;
  isLive: boolean;
  category?: string;
  isActive: boolean;
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
  giftCount,
  isLive,
  category,
  isActive,
}: LiveStreamPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(likeCount);
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
    if (!isLiked) {
      setLocalLikes(prev => prev + 1);
    } else {
      setLocalLikes(prev => prev - 1);
    }
    setIsLiked(!isLiked);
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
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-pink-600 to-rose-700" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="absolute top-24 left-4 flex items-center gap-2 z-20">
        {isLive && (
          <Badge className="bg-red-500 border-0 text-white gap-1.5 font-bold shadow-lg px-3 py-1" data-testid={`badge-live-${id}`}>
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            LIVE
          </Badge>
        )}
        <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white gap-1.5 font-medium px-3 py-1">
          <Users className="h-3.5 w-3.5" />
          {formatCount(viewerCount)}
        </Badge>
        {category && (
          <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white font-medium px-3 py-1">
            {category}
          </Badge>
        )}
      </div>

      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-4">
        <div className="relative mb-1">
          <Avatar className="h-11 w-11 ring-2 ring-red-500 shadow-lg">
            <AvatarImage src={creatorAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"} />
            <AvatarFallback className="bg-gradient-to-br from-red-400 to-pink-500 text-white font-bold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 border-0 shadow-lg"
            data-testid={`button-follow-${id}`}
          >
            <Plus className="h-3 w-3 text-white" />
          </Button>
        </div>

        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          data-testid={`button-like-${id}`}
        >
          <motion.div
            whileTap={{ scale: 1.3 }}
            className={`h-9 w-9 rounded-full flex items-center justify-center ${
              isLiked ? "bg-red-500/20" : "bg-white/10"
            } backdrop-blur-sm transition-colors`}
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isLiked ? "text-red-500 fill-red-500" : "text-white"
              }`}
            />
          </motion.div>
          <span className="text-[10px] text-white font-semibold">
            {formatCount(localLikes)}
          </span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-comment-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">コメント</span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-gift-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
            <Gift className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">{formatCount(giftCount)}</span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-share-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">シェア</span>
        </button>

        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-volume-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Volume2 className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>

      <div className="absolute left-4 right-20 bottom-28 z-10 space-y-3">
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

        <div className="flex items-center gap-2 text-white/80 text-xs">
          <Radio className="h-3 w-3 text-red-500" />
          <span>{formatCount(viewerCount)}人が視聴中</span>
        </div>
      </div>

      {isActive && (
        <motion.div
          className="absolute bottom-24 left-0 right-0 h-0.5 bg-white/20"
        >
          <motion.div
            className="h-full bg-red-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

const demoLiveStreams: LiveStreamPageProps[] = [
  {
    id: "live-1",
    title: "【18禁】脱衣リクエスト配信💋 投げ銭でどんどん脱ぐよ",
    creatorName: "Reina",
    displayName: "れいな💋",
    viewerCount: 2450,
    likeCount: 18500,
    giftCount: 3200,
    isLive: true,
    category: "脱衣",
    isActive: false,
    thumbnailUrl: img1,
  },
  {
    id: "live-2",
    title: "透けブラ＆Tバック試着会🖤 全部見せちゃう",
    creatorName: "Yua",
    displayName: "ゆあ🖤",
    viewerCount: 1890,
    likeCount: 15200,
    giftCount: 2800,
    isLive: true,
    category: "下着",
    isActive: false,
    thumbnailUrl: img2,
  },
  {
    id: "live-3",
    title: "バニーガール配信🐰 今夜はご主人様のために何でもします",
    creatorName: "Mio",
    displayName: "みお🐰",
    viewerCount: 1250,
    likeCount: 9800,
    giftCount: 1500,
    isLive: true,
    category: "コスプレ",
    isActive: false,
    thumbnailUrl: img3,
  },
  {
    id: "live-4",
    title: "シャワー配信💦 全身見せちゃうかも...？",
    creatorName: "Hina",
    displayName: "ひな💦",
    viewerCount: 3200,
    likeCount: 24500,
    giftCount: 4100,
    isLive: true,
    category: "入浴",
    isActive: false,
    thumbnailUrl: img4,
  },
  {
    id: "live-5",
    title: "メイドコス配信🎀 ご主人様のリクエストに全部応えます",
    creatorName: "Saki",
    displayName: "さき🎀",
    viewerCount: 1680,
    likeCount: 12300,
    giftCount: 2100,
    isLive: true,
    category: "メイド",
    isActive: false,
    thumbnailUrl: img5,
  },
];

export default function Live() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedType, setFeedType] = useState<"recommend" | "following">("recommend");
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: liveStreams } = useQuery<LiveStream[]>({
    queryKey: ["/api/live"],
  });

  const followingStreams = demoLiveStreams.filter((_, i) => i % 2 === 0);

  const displayStreams: LiveStreamPageProps[] = feedType === "following"
    ? followingStreams
    : liveStreams && liveStreams.length > 0
      ? liveStreams.map((s, idx) => ({
          id: s.id,
          title: s.title,
          thumbnailUrl: s.thumbnailUrl || demoLiveStreams[idx % demoLiveStreams.length]?.thumbnailUrl,
          creatorName: "Creator",
          viewerCount: s.viewerCount || 0,
          likeCount: 0,
          giftCount: 0,
          isLive: s.status === "live",
          category: undefined,
          isActive: false,
        }))
      : demoLiveStreams;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < displayStreams.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, displayStreams.length]);

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
        {displayStreams.map((stream, index) => (
          <LiveStreamPage
            key={stream.id}
            {...stream}
            isActive={index === activeIndex}
          />
        ))}
      </div>
      <BottomNavigation />
    </>
  );
}
