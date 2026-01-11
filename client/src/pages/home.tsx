import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Heart, Eye, Clock, Video, Crown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import type { Video as VideoType } from "@shared/schema";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  creatorName?: string;
  creatorAvatar?: string;
  viewCount: number;
  likeCount: number;
  duration: number;
  isPremium?: boolean;
}

function VideoCard({
  id,
  title,
  creatorName = "Creator",
  creatorAvatar,
  viewCount,
  likeCount,
  duration,
  isPremium,
}: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-pink-100/50 dark:border-pink-900/30 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 cursor-pointer"
      data-testid={`card-video-${id}`}
    >
      {/* Thumbnail */}
      <div className="aspect-[9/16] bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 relative overflow-hidden">
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="h-14 w-14 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:bg-pink-500 transition-colors duration-300"
          >
            <Play className="h-6 w-6 text-pink-500 group-hover:text-white ml-1 transition-colors" fill="currentColor" />
          </motion.div>
        </div>

        {/* Premium badge */}
        {isPremium && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border-0 text-amber-900 font-semibold shadow-lg gap-1">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        )}

        {/* Duration */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs text-white font-medium">
          <Clock className="h-3 w-3" />
          {formatDuration(duration)}
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-pink-200 dark:ring-pink-800 ring-offset-2 ring-offset-background">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-pink-400 to-rose-500 text-white font-semibold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 leading-snug" data-testid={`text-video-title-${id}`}>
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 font-medium" data-testid={`text-creator-name-${id}`}>
              {creatorName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium" data-testid={`text-view-count-${id}`}>
            <Eye className="h-3.5 w-3.5" />
            {formatCount(viewCount)}
          </span>
          <span className="flex items-center gap-1.5 font-medium" data-testid={`text-like-count-${id}`}>
            <Heart className="h-3.5 w-3.5 text-pink-500" fill="currentColor" />
            {formatCount(likeCount)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-pink-100/50 dark:border-pink-900/30">
      <Skeleton className="aspect-[9/16]" />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center mb-5">
        <Video className="h-10 w-10 text-pink-400" />
      </div>
      <h3 className="font-bold text-lg mb-2" data-testid="text-empty-videos">コンテンツがまだありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        クリエイターが動画を投稿するとここに表示されます
      </p>
    </motion.div>
  );
}

// Demo data for UI showcase
const demoVideos: VideoCardProps[] = [
  {
    id: "demo-1",
    title: "最新のファッションコーデを紹介します",
    creatorName: "Yuki",
    viewCount: 12500,
    likeCount: 890,
    duration: 180,
    isPremium: false,
  },
  {
    id: "demo-2",
    title: "朝のルーティン - モーニングルーティン",
    creatorName: "Sakura",
    viewCount: 45000,
    likeCount: 3200,
    duration: 420,
    isPremium: true,
  },
  {
    id: "demo-3",
    title: "カフェ巡り in 表参道",
    creatorName: "Miki",
    viewCount: 8900,
    likeCount: 560,
    duration: 240,
    isPremium: false,
  },
  {
    id: "demo-4",
    title: "メイクアップチュートリアル",
    creatorName: "Rina",
    viewCount: 23000,
    likeCount: 1800,
    duration: 600,
    isPremium: true,
  },
  {
    id: "demo-5",
    title: "週末のおでかけVlog",
    creatorName: "Hana",
    viewCount: 15600,
    likeCount: 980,
    duration: 320,
    isPremium: false,
  },
  {
    id: "demo-6",
    title: "新作コスメレビュー",
    creatorName: "Yuki",
    viewCount: 31000,
    likeCount: 2100,
    duration: 510,
    isPremium: false,
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("for-you");

  const { data: videos, isLoading, error } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  // Use demo data for UI showcase, real data when available
  const displayVideos: VideoCardProps[] = videos && videos.length > 0
    ? videos.map(v => ({
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        creatorName: "Creator",
        viewCount: v.viewCount || 0,
        likeCount: v.likeCount || 0,
        duration: v.duration || 0,
        isPremium: v.contentType === "premium",
      }))
    : demoVideos;

  return (
    <div className="pb-24 min-h-screen bg-gradient-to-b from-background to-pink-50/30 dark:to-pink-950/10">
      {/* Featured banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 p-4 text-white shadow-lg shadow-pink-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">新着コンテンツ</p>
            <p className="text-xs text-white/80">お気に入りのクリエイターをフォローしよう</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-14 z-30 glass border-b border-border/30">
          <TabsList className="w-full h-14 bg-transparent rounded-none justify-start px-4 gap-6">
            <TabsTrigger 
              value="for-you" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-4 text-base font-semibold"
              data-testid="tab-for-you"
            >
              おすすめ
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-4 text-base font-semibold"
              data-testid="tab-following"
            >
              フォロー中
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-4 text-base font-semibold"
              data-testid="tab-trending"
            >
              トレンド
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="for-you" className="mt-0 p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive mb-4" data-testid="text-error">データの読み込みに失敗しました</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {displayVideos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <VideoCard {...video} />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-0 p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center mb-5">
              <Heart className="h-10 w-10 text-pink-400" />
            </div>
            <h3 className="font-bold text-lg mb-2" data-testid="text-empty-following">フォロー中のコンテンツがありません</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              クリエイターをフォローして、最新の動画をチェックしよう
            </p>
          </motion.div>
        </TabsContent>

        <TabsContent value="trending" className="mt-0 p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[...displayVideos]
                .sort((a, b) => b.viewCount - a.viewCount)
                .map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <VideoCard {...video} />
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
