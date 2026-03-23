import { useQuery } from "@tanstack/react-query";
import { Radio, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  { id: "demo-1", creatorId: "demo-1", title: "脱衣リクエスト配信🔥どんどん脱ぐよ", creatorName: "れいな", viewerCount: 2450, thumbnailUrl: img1 },
  { id: "demo-2", creatorId: "demo-2", title: "下着試着会💕全部見せちゃう", creatorName: "ゆあ", viewerCount: 1890, thumbnailUrl: img2 },
  { id: "demo-3", creatorId: "demo-3", title: "バニーガール配信🐰今夜は何でもします", creatorName: "みお", viewerCount: 1250, thumbnailUrl: img3 },
  { id: "demo-4", creatorId: "demo-4", title: "シャワー配信🚿全身見せちゃうかも…？", creatorName: "ひな", viewerCount: 3200, thumbnailUrl: img4 },
  { id: "demo-5", creatorId: "demo-5", title: "メイドコス配信💖リクエスト全部応えます", creatorName: "さき", viewerCount: 1680, thumbnailUrl: img5 },
  { id: "demo-6", creatorId: "demo-6", title: "ビーチ配信🌊水着でお喋り", creatorName: "まい", viewerCount: 980, thumbnailUrl: img6 },
];

export default function Live() {
  const [, setLocation] = useLocation();

  const { data: liveStreams, isLoading } = useQuery<any[]>({
    queryKey: ["/api/live/active"],
    refetchInterval: 10000,
  });

  const streams = !isLoading && liveStreams && liveStreams.length > 0 ? liveStreams : demoStreams;

  const formatViewers = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header variant="solid" />

      <div className="pt-14 pb-20">
        {/* Page title */}
        <div className="px-4 py-4 border-b border-pink-50">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-base font-bold text-gray-900">ライブ配信中</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {streams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => {
                  if (!stream.id.startsWith("demo-")) {
                    setLocation(`/creator/${stream.creatorId}`);
                  }
                }}
                className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[3/4] text-left shadow-sm"
                data-testid={`live-card-${stream.id}`}
              >
                {/* Thumbnail */}
                {stream.thumbnailUrl ? (
                  <img
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-rose-500" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* LIVE badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    LIVE
                  </Badge>
                </div>

                {/* Viewer count */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                  <Eye className="h-3 w-3 text-white" />
                  <span className="text-white text-[10px] font-medium">{formatViewers(stream.viewerCount || 0)}</span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-7 w-7 ring-1 ring-white flex-shrink-0">
                      <AvatarImage src={stream.creatorAvatarUrl || stream.creatorAvatar} />
                      <AvatarFallback className="bg-pink-500 text-white text-[10px] font-bold">
                        {(stream.creatorDisplayName || stream.creatorName || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-xs font-semibold truncate">
                      {stream.creatorDisplayName || stream.creatorName}
                    </span>
                  </div>
                  <p className="text-white/80 text-[11px] leading-snug line-clamp-2">
                    {stream.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
