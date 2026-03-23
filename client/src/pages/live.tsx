import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Radio } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import Hls from "hls.js";

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

function formatCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

interface StreamData {
  id: string;
  creatorId: string;
  title: string;
  creatorName: string;
  likeCount: number;
  thumbnailUrl?: string;
  bunnyPlaybackUrl?: string;
  viewerCount?: number;
}

interface StreamCardProps {
  stream: StreamData;
}

function StreamCard({ stream }: StreamCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stream.likeCount);
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream.bunnyPlaybackUrl) return;

    const url = stream.bunnyPlaybackUrl;
    if (url.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.muted = true;
          video.play().catch(() => {});
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.muted = true;
        video.play().catch(() => {});
      }
    } else {
      video.src = url;
      video.muted = true;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream.bunnyPlaybackUrl]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(prev => { setLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
  };

  const handleEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/live-room/${stream.id}`);
  };

  return (
    <div className="w-full h-full relative bg-black flex-shrink-0">
      {stream.bunnyPlaybackUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          poster={stream.thumbnailUrl}
        />
      ) : stream.thumbnailUrl ? (
        <img src={stream.thumbnailUrl} alt={stream.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

      {/* LIVE badge */}
      <div className="absolute top-14 left-4 z-10 flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded-full">
          <Radio className="h-2.5 w-2.5 text-white animate-pulse" />
          <span className="text-white text-[10px] font-bold">LIVE</span>
        </div>
        {(stream.viewerCount ?? 0) > 0 && (
          <span className="text-white/80 text-[10px] bg-black/40 px-2 py-0.5 rounded-full">{stream.viewerCount}人視聴中</span>
        )}
      </div>

      <div className="absolute right-3 bottom-[100px] z-10 flex flex-col items-center gap-5">
        <button onClick={handleEnter} data-testid={`button-avatar-${stream.id}`}>
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-xl">
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold text-sm">
              {stream.creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>
        <button onClick={handleLike} className="flex flex-col items-center gap-1" data-testid={`button-like-${stream.id}`}>
          <motion.div whileTap={{ scale: 1.3 }} className="h-11 w-11 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md shadow-lg">
            <Heart className={`h-6 w-6 transition-colors drop-shadow ${liked ? "text-pink-400 fill-pink-400" : "text-white"}`} />
          </motion.div>
          <span className="text-[11px] text-white font-bold drop-shadow">{formatCount(likeCount)}</span>
        </button>
      </div>

      <div className="absolute bottom-24 left-4 right-20 z-10">
        <button onClick={handleEnter} className="mb-1">
          <span className="text-white font-bold text-sm drop-shadow">{stream.creatorName}</span>
        </button>
        <p className="text-white/90 text-sm drop-shadow leading-snug mb-3">{stream.title}</p>
        <button onClick={handleEnter} className="bg-pink-500 active:bg-pink-700 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg" data-testid={`button-enter-${stream.id}`}>
          入室する
        </button>
      </div>
    </div>
  );
}

export default function Live() {
  const [index, setIndex] = useState(0);
  const locked = useRef(false);
  const startY = useRef(0);

  const { data: liveStreamsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/live/active"],
    refetchInterval: 10000,
  });

  const mapLiveStream = (s: any): StreamData => ({
    id: s.id,
    creatorId: s.creatorId,
    title: s.title,
    creatorName: s.creatorDisplayName || s.creatorName || "Creator",
    likeCount: s.viewerCount || 0,
    thumbnailUrl: s.thumbnailUrl,
    bunnyPlaybackUrl: s.bunnyPlaybackUrl,
    viewerCount: s.viewerCount || 0,
  });

  const streams: StreamData[] = !isLoading && liveStreamsData && liveStreamsData.length > 0
    ? liveStreamsData.map(mapLiveStream)
    : demoStreams;

  const navigate = (dir: 1 | -1) => {
    if (locked.current) return;
    const next = index + dir;
    if (next < 0 || next >= streams.length) return;
    locked.current = true;
    setIndex(next);
    setTimeout(() => { locked.current = false; }, 500);
  };

  const indexRef = useRef(index);
  const lengthRef = useRef(streams.length);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { lengthRef.current = streams.length; }, [streams.length]);

  // Wheel
  useEffect(() => {
    const el = document.getElementById("live-feed");
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (locked.current) return;
      if (Math.abs(e.deltaY) < 30) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = indexRef.current + dir;
      if (next < 0 || next >= lengthRef.current) return;
      locked.current = true;
      setIndex(next);
      setTimeout(() => { locked.current = false; }, 900);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dy = startY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
  };

  return (
    <>
      <Header variant="overlay" />
      <div
        id="live-feed"
        className="h-[100svh] overflow-hidden bg-black flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* On desktop: constrain to 9:16 centered column. On mobile: full screen */}
        <div className="w-full h-full lg:h-full lg:max-w-[420px] lg:mx-auto relative overflow-hidden">
          <div
            style={{
              transform: `translateY(calc(-${index} * 100%))`,
              transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
              willChange: "transform",
              height: "100%",
            }}
          >
            {streams.map((stream) => (
              <div key={stream.id} style={{ height: "100%", width: "100%", position: "relative" }}>
                <StreamCard stream={stream} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNavigation />
    </>
  );
}
