import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Heart, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";

import img1 from "@assets/generated_images/live_mock_1.jpg";
import img2 from "@assets/generated_images/lingerie_bed_3.jpg";
import img3 from "@assets/generated_images/bunny_girl_5.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/sexy_maid_7.jpg";
import img6 from "@assets/generated_images/bikini_beach_5.jpg";

const demoStreams = [
  { id: "demo-1", creatorId: "demo-1", title: "脱衣リクエスト配信🔥どんどん脱ぐよ", creatorName: "れいな", viewerCount: 2450, likeCount: 18500, thumbnailUrl: img1 },
  { id: "demo-2", creatorId: "demo-2", title: "下着試着会💕全部見せちゃう", creatorName: "ゆあ", viewerCount: 1890, likeCount: 15200, thumbnailUrl: img2 },
  { id: "demo-3", creatorId: "demo-3", title: "バニーガール配信🐰今夜は何でもします", creatorName: "みお", viewerCount: 1250, likeCount: 9800, thumbnailUrl: img3 },
  { id: "demo-4", creatorId: "demo-4", title: "シャワー配信🚿全身見せちゃうかも…？", creatorName: "ひな", viewerCount: 3200, likeCount: 24500, thumbnailUrl: img4 },
  { id: "demo-5", creatorId: "demo-5", title: "メイドコス配信💖リクエスト全部応えます", creatorName: "さき", viewerCount: 1680, likeCount: 12300, thumbnailUrl: img5 },
  { id: "demo-6", creatorId: "demo-6", title: "ビーチ配信🌊水着でお喋り", creatorName: "まい", viewerCount: 980, likeCount: 7600, thumbnailUrl: img6 },
];

function formatCount(count: number) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

interface StreamCardProps {
  stream: typeof demoStreams[0];
  isActive: boolean;
}

function StreamCard({ stream, isActive }: StreamCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stream.likeCount);
  const [, setLocation] = useLocation();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stream.id.startsWith("demo-")) {
      setLocation(`/creator/${stream.creatorId}`);
    }
  };

  return (
    <div className="snap-start h-[100svh] w-full relative flex-shrink-0 bg-black">
      {/* Thumbnail */}
      {stream.thumbnailUrl && (
        <img
          src={stream.thumbnailUrl}
          alt={stream.title}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

      {/* LIVE badge + viewers (top-left) */}
      <div className="absolute top-16 left-4 flex items-center gap-2 z-10">
        <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md animate-pulse">
          LIVE
        </Badge>
        <div className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-0.5">
          <Eye className="h-3 w-3 text-white" />
          <span className="text-white text-xs font-medium">{formatCount(stream.viewerCount)}</span>
        </div>
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-[100px] z-10 flex flex-col items-center gap-5">
        {/* Avatar */}
        <button onClick={handleCreatorClick} data-testid={`button-avatar-${stream.id}`}>
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-xl">
            <AvatarImage src={stream.creatorAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold text-sm">
              {stream.creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1" data-testid={`button-like-${stream.id}`}>
          <motion.div
            whileTap={{ scale: 1.3 }}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md shadow-lg"
          >
            <Heart className={`h-6 w-6 transition-colors drop-shadow ${liked ? "text-pink-400 fill-pink-400" : "text-white"}`} />
          </motion.div>
          <span className="text-[11px] text-white font-bold drop-shadow">{formatCount(likeCount)}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-20 left-4 right-20 z-10">
        <button onClick={handleCreatorClick} className="flex items-center gap-2 mb-2">
          <span className="text-white font-bold text-sm drop-shadow">{stream.creatorName}</span>
        </button>
        <p className="text-white/90 text-sm drop-shadow leading-snug">{stream.title}</p>
      </div>
    </div>
  );
}

export default function Live() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: liveStreams, isLoading } = useQuery<any[]>({
    queryKey: ["/api/live/active"],
    refetchInterval: 10000,
  });

  const streams = !isLoading && liveStreams && liveStreams.length > 0 ? liveStreams : demoStreams;

  return (
    <div className="relative h-[100svh] bg-black overflow-hidden">
      <Header variant="overlay" />

      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const index = Math.round(el.scrollTop / el.clientHeight);
          setActiveIndex(index);
        }}
      >
        {streams.map((stream, i) => (
          <StreamCard key={stream.id} stream={stream} isActive={i === activeIndex} />
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}
