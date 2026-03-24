import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface BunnyPlayerProps {
  bunnyVideoId?: string;
  fallbackVideoUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  isMuted: boolean;
  isPaused: boolean;
  loop?: boolean;
  onTimeUpdate?: (progress: number) => void;
  onLoadedMetadata?: (isHorizontal: boolean) => void;
  className?: string;
}

const BUNNY_CDN_HOSTNAME = import.meta.env.VITE_BUNNY_CDN_HOSTNAME || "";

export function getBunnyHlsUrl(bunnyVideoId: string): string {
  if (!BUNNY_CDN_HOSTNAME || !bunnyVideoId) return "";
  return `https://${BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/playlist.m3u8`;
}

export function getBunnyThumbnail(bunnyVideoId: string): string {
  if (!BUNNY_CDN_HOSTNAME || !bunnyVideoId) return "";
  return `https://${BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/thumbnail.jpg`;
}

export function BunnyPlayer({
  bunnyVideoId,
  fallbackVideoUrl,
  thumbnailUrl,
  isActive,
  isMuted,
  isPaused,
  loop = true,
  onTimeUpdate,
  onLoadedMetadata,
  className = "absolute inset-0 w-full h-full object-contain",
}: BunnyPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isReady, setIsReady] = useState(false);

  const hlsUrl = bunnyVideoId ? getBunnyHlsUrl(bunnyVideoId) : "";
  const effectiveUrl = hlsUrl || fallbackVideoUrl || "";
  const effectiveThumbnail = thumbnailUrl || (bunnyVideoId ? getBunnyThumbnail(bunnyVideoId) : "");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !effectiveUrl) return;

    const isHlsUrl = effectiveUrl.endsWith(".m3u8");

    if (isHlsUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(effectiveUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error("HLS fatal error:", data.type, data.details);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = effectiveUrl;
        setIsReady(true);
      }
    } else {
      video.src = effectiveUrl;
      setIsReady(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [effectiveUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;
    video.muted = isMuted;
  }, [isMuted, isReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReady) return;

    if (isActive && !isPaused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive, isPaused, isReady]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;
    const { currentTime, duration } = video;
    if (duration > 0) {
      onTimeUpdate((currentTime / duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !onLoadedMetadata) return;
    const { videoWidth, videoHeight } = video;
    if (videoWidth > 0 && videoHeight > 0) {
      onLoadedMetadata(videoWidth > videoHeight);
    }
  };

  if (!effectiveUrl) return null;

  return (
    <video
      ref={videoRef}
      className={className}
      loop={loop}
      muted={isMuted}
      playsInline
      poster={effectiveThumbnail}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
