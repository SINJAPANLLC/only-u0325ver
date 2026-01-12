import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Radio, Users, Heart, MessageCircle, Share2, Gift, Lock, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { LiveStream } from "@shared/schema";

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
  creatorAvatar?: string;
  viewerCount: number;
  likeCount: number;
  giftCount: number;
  isLive: boolean;
  category?: string;
  isPremium?: boolean;
  isActive: boolean;
}

function LiveStreamPage({
  id,
  title,
  thumbnailUrl,
  creatorName,
  viewerCount,
  likeCount,
  giftCount,
  isLive,
  category,
  isPremium,
  isActive,
}: LiveStreamPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(likeCount);

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
    <div 
      className="h-[calc(100svh-7.5rem)] w-full relative snap-start snap-always flex-shrink-0"
      data-testid={`live-stream-${id}`}
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

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

      {isPremium && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-10"
        >
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <p className="text-white font-bold text-lg">VIPメンバー限定配信</p>
          <Button className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 font-bold px-8">
            <Crown className="h-4 w-4 mr-2" />
            VIPになる
          </Button>
        </motion.div>
      )}

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {isLive && (
            <Badge className="bg-red-500 border-0 text-white gap-1.5 font-bold shadow-lg px-3 py-1" data-testid={`badge-live-${id}`}>
              <span className="h-2 w-2 rounded-full bg-white animate-live-pulse" />
              LIVE
            </Badge>
          )}
          <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white gap-1.5 font-medium px-3 py-1">
            <Users className="h-3.5 w-3.5" />
            {formatCount(viewerCount)}
          </Badge>
        </div>
        {category && (
          <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white font-medium px-3 py-1">
            {category}
          </Badge>
        )}
      </div>

      <div className="absolute right-3 bottom-36 flex flex-col items-center gap-5 z-20">
        <motion.div 
          className="flex flex-col items-center"
          whileTap={{ scale: 0.9 }}
        >
          <Avatar className="h-12 w-12 ring-2 ring-red-500 ring-offset-2 ring-offset-black/50 mb-1">
            <AvatarFallback className="bg-gradient-to-br from-red-400 to-pink-500 text-white font-bold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-xs font-medium drop-shadow-lg">{creatorName}</span>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className="flex flex-col items-center"
          data-testid={`button-like-${id}`}
        >
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            isLiked ? "bg-red-500" : "bg-black/40 backdrop-blur-sm"
          }`}>
            <Heart className={`h-6 w-6 ${isLiked ? "text-white fill-white" : "text-white"}`} />
          </div>
          <span className="text-white text-xs font-semibold mt-1 drop-shadow-lg">{formatCount(localLikes)}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
          data-testid={`button-comment-${id}`}
        >
          <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold mt-1 drop-shadow-lg">コメント</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
          data-testid={`button-gift-${id}`}
        >
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold mt-1 drop-shadow-lg">{formatCount(giftCount)}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
          data-testid={`button-share-${id}`}
        >
          <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xs font-semibold mt-1 drop-shadow-lg">共有</span>
        </motion.button>
      </div>

      <div className="absolute bottom-24 left-4 right-20 z-20">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 border-0 text-white gap-1">
            <Sparkles className="h-3 w-3" />
            人気配信
          </Badge>
        </div>
        <h2 className="text-white font-bold text-base leading-tight mb-2 drop-shadow-lg line-clamp-2" data-testid={`text-live-title-${id}`}>
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm">@{creatorName}</span>
          <span className="text-white/60 text-sm">•</span>
          <span className="text-white/80 text-sm">{formatCount(viewerCount)}人が視聴中</span>
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
    </div>
  );
}

const demoLiveStreams: LiveStreamPageProps[] = [
  {
    id: "live-1",
    title: "【18禁】脱衣リクエスト配信💋 投げ銭でどんどん脱ぐよ",
    creatorName: "Reina",
    viewerCount: 2450,
    likeCount: 18500,
    giftCount: 3200,
    isLive: true,
    category: "脱衣",
    isPremium: false,
    isActive: false,
    thumbnailUrl: img1,
  },
  {
    id: "live-2",
    title: "透けブラ＆Tバック試着会🖤 全部見せちゃう",
    creatorName: "Yua",
    viewerCount: 1890,
    likeCount: 15200,
    giftCount: 2800,
    isLive: true,
    category: "下着",
    isPremium: false,
    isActive: false,
    thumbnailUrl: img2,
  },
  {
    id: "live-3",
    title: "バニーガール配信🐰 今夜はご主人様のために何でもします",
    creatorName: "Mio",
    viewerCount: 1250,
    likeCount: 9800,
    giftCount: 1500,
    isLive: true,
    category: "コスプレ",
    isPremium: false,
    isActive: false,
    thumbnailUrl: img3,
  },
  {
    id: "live-4",
    title: "シャワー配信💦 全身見せちゃうかも...？",
    creatorName: "Hina",
    viewerCount: 3200,
    likeCount: 24500,
    giftCount: 4100,
    isLive: true,
    category: "入浴",
    isPremium: true,
    isActive: false,
    thumbnailUrl: img4,
  },
  {
    id: "live-5",
    title: "メイドコス配信🎀 ご主人様のリクエストに全部応えます",
    creatorName: "Saki",
    viewerCount: 1680,
    likeCount: 12300,
    giftCount: 2100,
    isLive: true,
    category: "メイド",
    isPremium: false,
    isActive: false,
    thumbnailUrl: img5,
  },
];

export default function Live() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: liveStreams } = useQuery<LiveStream[]>({
    queryKey: ["/api/live"],
  });

  const displayStreams: LiveStreamPageProps[] = liveStreams && liveStreams.length > 0
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
        isPremium: false,
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
      setActiveIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100svh-7.5rem)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
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
  );
}
