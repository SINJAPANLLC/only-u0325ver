import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Radio, Users, Heart, Share2, Plus, Volume2, Lock, Send, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type ChatType = "peek" | "party" | "twoshot";

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
  pricePerMinute: {
    peek: number;
    party: number;
    twoshot: number;
  };
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
  pricePerMinute,
}: LiveStreamPageProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(likeCount);
  const [chatType, setChatType] = useState<ChatType>("peek");
  const [comment, setComment] = useState("");
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
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-pink-600 to-rose-700" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

      <div className="absolute top-24 left-4 flex flex-wrap items-center gap-2 z-20">
        {isLive && (
          <Badge className="bg-pink-500 border-0 text-white gap-1.5 font-bold shadow-lg px-2 py-0.5 text-xs" data-testid={`badge-live-${id}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </Badge>
        )}
        <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white gap-1 font-medium px-2 py-0.5 text-xs">
          <Users className="h-3 w-3" />
          {formatCount(viewerCount)}
        </Badge>
        {category && (
          <Badge className="bg-black/50 backdrop-blur-sm border-0 text-white font-medium px-2 py-0.5 text-xs">
            {category}
          </Badge>
        )}
      </div>

      <div className="absolute right-3 top-32 z-10 flex flex-col items-center gap-3">
        <div className="relative mb-1">
          <Avatar className="h-11 w-11 ring-2 ring-pink-500 shadow-lg">
            <AvatarImage src={creatorAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face"} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-pink-600 text-white font-bold">
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

        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-0.5"
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
          className="flex flex-col items-center gap-0.5"
          data-testid={`button-share-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] text-white font-semibold">シェア</span>
        </button>

        <button
          className="flex flex-col items-center gap-0.5"
          data-testid={`button-volume-${id}`}
        >
          <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Volume2 className="h-4 w-4 text-white" />
          </div>
        </button>
      </div>

      <div className="absolute left-4 right-16 bottom-44 z-10 space-y-1">
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

      <div className="absolute bottom-32 left-4 right-4 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatType("peek")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-all ${
              chatType === "peek"
                ? "bg-pink-500 text-white"
                : "bg-black/50 backdrop-blur-sm text-white/90 border border-white/20"
            }`}
            data-testid="button-chat-peek"
          >
            <Eye className="h-3.5 w-3.5" />
            のぞき {pricePerMinute.peek}pt
          </button>
          <button
            onClick={() => setChatType("party")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-all ${
              chatType === "party"
                ? "bg-pink-500 text-white"
                : "bg-black/50 backdrop-blur-sm text-white/90 border border-white/20"
            }`}
            data-testid="button-chat-party"
          >
            <Users className="h-3.5 w-3.5" />
            パーティ {pricePerMinute.party}pt
          </button>
          <button
            onClick={() => setChatType("twoshot")}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-medium transition-all ${
              chatType === "twoshot"
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                : "bg-black/50 backdrop-blur-sm text-white/90 border border-white/20"
            }`}
            data-testid="button-chat-twoshot"
          >
            <Lock className="h-3.5 w-3.5" />
            2ショット {pricePerMinute.twoshot}pt
          </button>
        </div>
      </div>

      <div className="absolute bottom-[4.5rem] left-4 right-4 z-20">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="コメントを入力..."
              className="bg-black/50 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 pr-10 h-10 rounded-full text-sm"
              data-testid="input-comment"
            />
            <Button
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-pink-500 hover:bg-pink-600"
              data-testid="button-send-comment"
            >
              <Send className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {isActive && (
        <motion.div
          className="absolute bottom-[4.5rem] left-0 right-0 h-0.5 bg-white/20"
        >
          <motion.div
            className="h-full bg-pink-500"
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
    title: "夜の癒し配信 今夜もゆっくりお話ししましょ",
    creatorName: "Reina",
    displayName: "れいな",
    viewerCount: 2450,
    likeCount: 18500,
    isLive: true,
    category: "トーク",
    isActive: false,
    thumbnailUrl: img1,
    pricePerMinute: { peek: 100, party: 100, twoshot: 250 },
  },
  {
    id: "live-2",
    title: "コスプレ配信 リクエスト受付中",
    creatorName: "Yua",
    displayName: "ゆあ",
    viewerCount: 1890,
    likeCount: 15200,
    isLive: true,
    category: "コスプレ",
    isActive: false,
    thumbnailUrl: img2,
    pricePerMinute: { peek: 100, party: 100, twoshot: 250 },
  },
  {
    id: "live-3",
    title: "お悩み相談配信 何でも聞くよ",
    creatorName: "Mio",
    displayName: "みお",
    viewerCount: 1250,
    likeCount: 9800,
    isLive: true,
    category: "相談",
    isActive: false,
    thumbnailUrl: img3,
    pricePerMinute: { peek: 100, party: 100, twoshot: 250 },
  },
  {
    id: "live-4",
    title: "深夜のまったり配信",
    creatorName: "Hina",
    displayName: "ひな",
    viewerCount: 3200,
    likeCount: 24500,
    isLive: true,
    category: "雑談",
    isActive: false,
    thumbnailUrl: img4,
    pricePerMinute: { peek: 100, party: 100, twoshot: 250 },
  },
  {
    id: "live-5",
    title: "ASMR配信 囁きで癒します",
    creatorName: "Saki",
    displayName: "さき",
    viewerCount: 1680,
    likeCount: 12300,
    isLive: true,
    category: "ASMR",
    isActive: false,
    thumbnailUrl: img5,
    pricePerMinute: { peek: 100, party: 100, twoshot: 250 },
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
          isLive: s.status === "live",
          category: undefined,
          isActive: false,
          pricePerMinute: { peek: 100, party: 100, twoshot: 250 },
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
