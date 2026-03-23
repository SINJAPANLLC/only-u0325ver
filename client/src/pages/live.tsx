import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  { id: "demo-1", creatorId: "demo-1", title: "脱衣リクエスト配信🔥どんどん脱ぐよ", creatorName: "れいな", likeCount: 18500, thumbnailUrl: img1 },
  { id: "demo-2", creatorId: "demo-2", title: "下着試着会💕全部見せちゃう", creatorName: "ゆあ", likeCount: 15200, thumbnailUrl: img2 },
  { id: "demo-3", creatorId: "demo-3", title: "バニーガール配信🐰今夜は何でもします", creatorName: "みお", likeCount: 9800, thumbnailUrl: img3 },
  { id: "demo-4", creatorId: "demo-4", title: "シャワー配信🚿全身見せちゃうかも…？", creatorName: "ひな", likeCount: 24500, thumbnailUrl: img4 },
  { id: "demo-5", creatorId: "demo-5", title: "メイドコス配信💖リクエスト全部応えます", creatorName: "さき", likeCount: 12300, thumbnailUrl: img5 },
  { id: "demo-6", creatorId: "demo-6", title: "ビーチ配信🌊水着でお喋り", creatorName: "まい", likeCount: 7600, thumbnailUrl: img6 },
];

function formatCount(count: number) {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

interface StreamCardProps {
  stream: typeof demoStreams[0];
  direction: number;
}

function StreamCard({ stream, direction }: StreamCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stream.likeCount);
  const [, setLocation] = useLocation();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(prev => {
      setLikeCount(c => prev ? c - 1 : c + 1);
      return !prev;
    });
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stream.id.startsWith("demo-")) {
      setLocation(`/creator/${stream.creatorId}`);
    }
  };

  return (
    <motion.div
      key={stream.id}
      className="absolute inset-0 bg-black"
      initial={{ y: direction > 0 ? "100%" : "-100%" }}
      animate={{ y: 0 }}
      exit={{ y: direction > 0 ? "-100%" : "100%" }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      {stream.thumbnailUrl && (
        <img
          src={stream.thumbnailUrl}
          alt={stream.title}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

      {/* Right side actions */}
      <div className="absolute right-3 bottom-[100px] z-10 flex flex-col items-center gap-5">
        <button onClick={handleCreatorClick} data-testid={`button-avatar-${stream.id}`}>
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-xl">
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold text-sm">
              {stream.creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>

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
      <div className="absolute bottom-24 left-4 right-20 z-10">
        <button onClick={handleCreatorClick} className="mb-1">
          <span className="text-white font-bold text-sm drop-shadow">{stream.creatorName}</span>
        </button>
        <p className="text-white/90 text-sm drop-shadow leading-snug mb-3">{stream.title}</p>
        <button
          onClick={handleCreatorClick}
          className="bg-pink-500 active:bg-pink-700 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg"
          data-testid={`button-enter-${stream.id}`}
        >
          入室する
        </button>
      </div>
    </motion.div>
  );
}

export default function Live() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartY = useRef(0);
  const isAnimating = useRef(false);

  const { data: liveStreams, isLoading } = useQuery<any[]>({
    queryKey: ["/api/live/active"],
    refetchInterval: 10000,
  });

  const streams = !isLoading && liveStreams && liveStreams.length > 0 ? liveStreams : demoStreams;

  const goTo = (next: number) => {
    if (isAnimating.current) return;
    const clamped = Math.max(0, Math.min(next, streams.length - 1));
    if (clamped === activeIndex) return;
    isAnimating.current = true;
    setDirection(next > activeIndex ? 1 : -1);
    setActiveIndex(clamped);
    setTimeout(() => { isAnimating.current = false; }, 400);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) < 50) return;
    goTo(activeIndex + (diff > 0 ? 1 : -1));
  };

  return (
    <div
      className="relative h-[100svh] bg-black overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Header variant="overlay" />

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <StreamCard
          key={activeIndex}
          stream={streams[activeIndex]}
          direction={direction}
        />
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
}
