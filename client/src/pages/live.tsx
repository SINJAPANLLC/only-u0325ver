import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Radio } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import Hls from "hls.js";

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
  creatorAvatarUrl?: string;
  likeCount: number;
  viewerCount: number;
  thumbnailUrl?: string;
  bunnyPlaybackUrl?: string;
  partyRatePerMinute?: number;
  twoshotRatePerMinute?: number;
}

function StreamCard({ stream }: { stream: StreamData }) {
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

  const handleProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/creator/${stream.creatorId}`);
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
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : stream.thumbnailUrl ? (
        <img
          src={stream.thumbnailUrl}
          alt={stream.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-pink-900 to-black" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

      {/* LIVE badge */}
      <div className="absolute top-14 left-4 z-10 flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500 rounded-full">
          <Radio className="h-2.5 w-2.5 text-white animate-pulse" />
          <span className="text-white text-[10px] font-bold">LIVE</span>
        </div>
        {stream.viewerCount > 0 && (
          <span className="text-white/80 text-[10px] bg-black/40 px-2 py-0.5 rounded-full">
            {formatCount(stream.viewerCount)}人視聴中
          </span>
        )}
      </div>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-[100px] z-10 flex flex-col items-center gap-5">
        <button onClick={handleProfile} data-testid={`button-avatar-${stream.id}`}>
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-xl">
            <AvatarImage src={stream.creatorAvatarUrl} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold text-sm">
              {stream.creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          data-testid={`button-like-${stream.id}`}
        >
          <motion.div
            whileTap={{ scale: 1.3 }}
            className="h-11 w-11 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md shadow-lg"
          >
            <Heart
              className={`h-6 w-6 transition-colors drop-shadow ${
                liked ? "text-pink-400 fill-pink-400" : "text-white"
              }`}
            />
          </motion.div>
          <span className="text-[11px] text-white font-bold drop-shadow">{formatCount(likeCount)}</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-24 left-4 right-20 z-10">
        <button onClick={handleEnter} className="mb-1">
          <span className="text-white font-bold text-sm drop-shadow">{stream.creatorName}</span>
        </button>
        <p className="text-white/90 text-sm drop-shadow leading-snug mb-3 line-clamp-2">{stream.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleEnter}
            className="bg-pink-500 active:bg-pink-700 text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg"
            data-testid={`button-enter-${stream.id}`}
          >
            入室する
          </button>
          {stream.partyRatePerMinute != null && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="text-pink-300 text-[10px] font-bold">パーティー</span>
              <span className="text-white text-[10px] font-bold">{stream.partyRatePerMinute}pt/分</span>
            </div>
          )}
          {stream.twoshotRatePerMinute != null && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="text-pink-300 text-[10px] font-bold">2ショット</span>
              <span className="text-white text-[10px] font-bold">{stream.twoshotRatePerMinute}pt/分</span>
            </div>
          )}
        </div>
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
    refetchInterval: 15000,
  });

  const streams: StreamData[] = (liveStreamsData || []).map((s: any) => ({
    id: s.id,
    creatorId: s.creatorId,
    title: s.title,
    creatorName: s.creatorDisplayName || s.creatorName || "Creator",
    creatorAvatarUrl: s.creatorAvatar || s.creatorAvatarUrl,
    likeCount: s.viewerCount || 0,
    viewerCount: s.viewerCount || 0,
    thumbnailUrl: s.thumbnailUrl,
    bunnyPlaybackUrl: s.bunnyPlaybackUrl,
    partyRatePerMinute: s.partyRatePerMinute,
    twoshotRatePerMinute: s.twoshotRatePerMinute,
  }));

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
        <div className="w-full h-full lg:h-full lg:max-w-[420px] lg:mx-auto relative overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white/50 text-sm">配信を検索中...</p>
              </div>
            </div>
          ) : streams.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-950 to-black">
              <div className="flex flex-col items-center gap-4 px-8 text-center">
                <h2 className="text-white font-bold text-xl">現在配信中のライブはありません</h2>
                <p className="text-white/50 text-sm leading-relaxed">
                  クリエイターが配信を開始するとここに表示されます。<br />
                  しばらくお待ちください。
                </p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
      <BottomNavigation />
    </>
  );
}
