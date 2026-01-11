import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Heart, Eye, Clock, Video } from "lucide-react";
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
      className="group relative rounded-2xl overflow-hidden bg-card border border-card-border hover-elevate cursor-pointer"
      data-testid={`card-video-${id}`}
    >
      <div className="aspect-[9/16] bg-gradient-to-br from-primary/10 to-pink-400/10 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-background/80 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 text-primary ml-0.5" fill="currentColor" />
          </div>
        </div>

        {isPremium && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white">
            Premium
          </Badge>
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
          <Clock className="h-3 w-3" />
          {formatDuration(duration)}
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 leading-tight" data-testid={`text-video-title-${id}`}>{title}</h3>
            <p className="text-xs text-muted-foreground mt-1" data-testid={`text-creator-name-${id}`}>{creatorName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" data-testid={`text-view-count-${id}`}>
            <Eye className="h-3 w-3" />
            {formatCount(viewCount)}
          </span>
          <span className="flex items-center gap-1" data-testid={`text-like-count-${id}`}>
            <Heart className="h-3 w-3" />
            {formatCount(likeCount)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-card-border">
      <Skeleton className="aspect-[9/16]" />
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Video className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2" data-testid="text-empty-videos">コンテンツがまだありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        クリエイターが動画を投稿するとここに表示されます
      </p>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("for-you");

  const { data: videos, isLoading, error } = useQuery<VideoType[]>({
    queryKey: ["/api/videos"],
  });

  const displayVideos: VideoCardProps[] = videos
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
    : [];

  return (
    <div className="pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border/50">
          <TabsList className="w-full h-12 bg-transparent rounded-none justify-start px-4 gap-4">
            <TabsTrigger 
              value="for-you" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
              data-testid="tab-for-you"
            >
              おすすめ
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
              data-testid="tab-following"
            >
              フォロー中
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
              data-testid="tab-trending"
            >
              トレンド
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="for-you" className="mt-0 p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-destructive mb-4" data-testid="text-error">データの読み込みに失敗しました</p>
            </div>
          ) : displayVideos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-3">
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2" data-testid="text-empty-following">フォロー中のコンテンツがありません</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              クリエイターをフォローして、最新の動画をチェックしよう
            </p>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-0 p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          ) : displayVideos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-3">
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
