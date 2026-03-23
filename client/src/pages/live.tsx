import { useQuery } from "@tanstack/react-query";
import { Radio, Users, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { useLocation } from "wouter";

export default function Live() {
  const [, setLocation] = useLocation();

  const { data: liveStreams, isLoading } = useQuery<any[]>({
    queryKey: ["/api/live/active"],
    refetchInterval: 10000,
  });

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
        ) : !liveStreams || liveStreams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="h-20 w-20 rounded-full bg-pink-50 flex items-center justify-center mb-4">
              <Radio className="h-10 w-10 text-pink-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">現在配信中のクリエイターはいません</h2>
            <p className="text-sm text-gray-400">クリエイターが配信を開始するとここに表示されます</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {liveStreams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setLocation(`/creator/${stream.creatorId}`)}
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
