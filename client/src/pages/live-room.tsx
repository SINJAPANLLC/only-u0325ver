import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Share2, Radio, Send, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation, useParams } from "wouter";
import Hls from "hls.js";

import img1 from "@assets/generated_images/live_mock_1.jpg";
import img2 from "@assets/generated_images/lingerie_bed_3.jpg";
import img3 from "@assets/generated_images/bunny_girl_5.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/sexy_maid_7.jpg";
import img6 from "@assets/generated_images/bikini_beach_5.jpg";

const demoStreams: Record<string, {
  title: string; creatorName: string; viewerCount: number; thumbnailUrl: string; bunnyPlaybackUrl?: string;
}> = {
  "demo-1": { title: "脱衣リクエスト配信🔥どんどん脱ぐよ", creatorName: "れいな", viewerCount: 3241, thumbnailUrl: img1 },
  "demo-2": { title: "下着試着会💕全部見せちゃう", creatorName: "ゆあ", viewerCount: 2187, thumbnailUrl: img2 },
  "demo-3": { title: "バニーガール配信🐰今夜は何でもします", creatorName: "みお", viewerCount: 1542, thumbnailUrl: img3 },
  "demo-4": { title: "シャワー配信🚿全身見せちゃうかも…？", creatorName: "ひな", viewerCount: 4820, thumbnailUrl: img4 },
  "demo-5": { title: "メイドコス配信💖リクエスト全部応えます", creatorName: "さき", viewerCount: 2310, thumbnailUrl: img5 },
  "demo-6": { title: "ビーチ配信🌊水着でお喋り", creatorName: "まい", viewerCount: 876, thumbnailUrl: img6 },
};

const demoUserNames = ["たろう", "はなこ", "ゆうた", "あいか", "けんじ", "みつき", "りょう", "さゆり", "だいき", "のぞみ"];

function randomName() {
  return demoUserNames[Math.floor(Math.random() * demoUserNames.length)];
}

const demoChatMessages = [
  { id: 1, user: "たろう", text: "きたーーー！！" },
  { id: 2, user: "はなこ", text: "かわいい💕" },
  { id: 3, user: "ゆうた", text: "リクエストしていい？" },
  { id: 4, user: "あいか", text: "ずっと待ってた！！" },
  { id: 5, user: "けんじ", text: "最高すぎる🔥" },
];

interface ChatMessage {
  id: number;
  user: string;
  text: string;
}

interface FloatingHeart {
  id: number;
  x: number;
}

function formatCount(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function LiveRoom() {
  const params = useParams<{ streamId: string }>();
  const streamId = params.streamId || "demo-1";
  const [, setLocation] = useLocation();

  const stream = demoStreams[streamId];
  const creatorName = stream?.creatorName ?? "クリエイター";
  const title = stream?.title ?? "LIVE配信中";
  const [viewerCount, setViewerCount] = useState(stream?.viewerCount ?? 120);
  const thumbnailUrl = stream?.thumbnailUrl;
  const bunnyPlaybackUrl = stream?.bunnyPlaybackUrl;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 5000) + 500);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const heartIdRef = useRef(0);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(demoChatMessages);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(100);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Simulate incoming chat messages
  useEffect(() => {
    const interval = setInterval(() => {
      const texts = [
        "すごい！！", "かわいい💕", "最高🔥", "もっと見せて！",
        "リクエスト送ります！", "ずっと応援してます", "神配信✨",
        "キャー💓", "待ってました！", "ありがとう！",
      ];
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      const newMsg: ChatMessage = {
        id: ++msgIdRef.current,
        user: randomName(),
        text: randomText,
      };
      setChatMessages(prev => [...prev.slice(-30), newMsg]);
    }, 2500);

    // Viewer count drift
    const viewerInterval = setInterval(() => {
      setViewerCount(v => Math.max(50, v + Math.floor(Math.random() * 11) - 5));
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(viewerInterval);
    };
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // HLS video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !bunnyPlaybackUrl) return;
    const url = bunnyPlaybackUrl;
    if (url.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.muted = true; video.play().catch(() => {}); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.muted = true;
      video.play().catch(() => {});
    }
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [bunnyPlaybackUrl]);

  const handleLike = useCallback(() => {
    setLiked(prev => { setLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
    const id = ++heartIdRef.current;
    const x = Math.random() * 40 - 20;
    setFloatingHearts(prev => [...prev, { id, x }]);
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== id)), 1200);
  }, []);

  const sendChat = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const newMsg: ChatMessage = { id: ++msgIdRef.current, user: "あなた", text };
    setChatMessages(prev => [...prev.slice(-30), newMsg]);
    setInputText("");
  }, [inputText]);


  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        {bunnyPlaybackUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
            poster={thumbnailUrl}
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-pink-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-safe pt-3 pb-2">
        <button
          onClick={() => setLocation("/live")}
          className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
          data-testid="button-back-live"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* Creator + LIVE */}
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
          <Avatar className="h-7 w-7 ring-1 ring-white/50">
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs font-bold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-bold">{creatorName}</span>
          <div className="flex items-center gap-1 bg-red-500 rounded-full px-2 py-0.5">
            <Radio className="h-2.5 w-2.5 text-white animate-pulse" />
            <span className="text-white text-[10px] font-bold">LIVE</span>
          </div>
        </div>

        {/* Viewer count */}
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5">
          <Users className="h-3.5 w-3.5 text-white/70" />
          <span className="text-white text-xs font-bold">{formatCount(viewerCount)}</span>
        </div>
      </div>

      {/* Stream title */}
      <div className="relative z-10 px-4 mt-1">
        <p className="text-white/90 text-xs drop-shadow line-clamp-1">{title}</p>
      </div>

      {/* Main area spacer */}
      <div className="relative z-10 flex-1" />

      {/* Bottom area: chat left + action buttons right */}
      <div className="relative z-10 flex items-end gap-2 px-3 pb-2">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1.5" style={{ maxHeight: "30vh" }}>
          {chatMessages.map(msg => (
            <div key={msg.id} className="flex items-start gap-2">
              <div className="flex items-baseline gap-1.5 bg-black/40 backdrop-blur-sm rounded-2xl px-3 py-1.5 max-w-full">
                <span className="text-pink-300 text-xs font-bold whitespace-nowrap">{msg.user}</span>
                <span className="text-white text-xs break-words">{msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Action buttons column */}
        <div className="flex flex-col items-center gap-4 pb-1 flex-shrink-0">
          {/* Like */}
          <div className="flex flex-col items-center gap-1 relative">
            <AnimatePresence>
              {floatingHearts.map(h => (
                <motion.div
                  key={h.id}
                  className="absolute bottom-12 pointer-events-none"
                  style={{ left: `calc(50% + ${h.x}px)` }}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -80, opacity: 0, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                >
                  <Heart className="h-5 w-5 text-pink-400 fill-pink-400" />
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.button
              whileTap={{ scale: 1.25 }}
              onClick={handleLike}
              className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg"
              data-testid="button-like-liveroom"
            >
              <Heart className={`h-6 w-6 transition-colors drop-shadow ${liked ? "text-pink-400 fill-pink-400" : "text-white"}`} />
            </motion.button>
            <span className="text-white text-[10px] font-bold drop-shadow">{formatCount(likeCount)}</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 1.15 }}
              className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shadow-lg"
              data-testid="button-share-liveroom"
            >
              <Share2 className="h-5 w-5 text-white/80" />
            </motion.button>
            <span className="text-white/60 text-[10px]">シェア</span>
          </div>
        </div>
      </div>

      {/* Chat input */}
      <div className="relative z-10 px-3 pb-safe pb-5 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md rounded-full px-4 h-10 gap-2 border border-white/20">
          <input
            className="flex-1 bg-transparent text-white text-sm placeholder-white/40 outline-none"
            placeholder="コメントする…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
            data-testid="input-chat"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={sendChat}
          disabled={!inputText.trim()}
          className="h-10 w-10 rounded-full bg-pink-500 disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          data-testid="button-send-chat"
        >
          <Send className="h-4.5 w-4.5 text-white" style={{ height: "18px", width: "18px" }} />
        </motion.button>
      </div>
    </div>
  );
}
