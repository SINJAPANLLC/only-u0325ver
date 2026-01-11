import { motion } from "framer-motion";
import { Radio, Users, Clock, Play, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LiveStream } from "@shared/schema";

interface LiveStreamCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  creatorName: string;
  creatorAvatar?: string;
  viewerCount: number;
  isLive: boolean;
  category?: string;
  duration?: number;
}

function LiveStreamCard({
  id,
  title,
  creatorName,
  creatorAvatar,
  viewerCount,
  isLive,
  category,
}: LiveStreamCardProps) {
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
      data-testid={`card-live-${id}`}
    >
      <div className="aspect-video bg-gradient-to-br from-pink-200 to-rose-200 dark:from-pink-900/40 dark:to-rose-900/40 relative overflow-hidden">
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="h-16 w-16 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:bg-red-500 transition-colors duration-300"
          >
            <Play className="h-7 w-7 text-red-500 group-hover:text-white ml-1 transition-colors" fill="currentColor" />
          </motion.div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isLive && (
            <Badge className="bg-red-500 border-0 text-white gap-1.5 font-bold shadow-lg animate-pulse" data-testid={`badge-live-${id}`}>
              <span className="h-2 w-2 rounded-full bg-white animate-live-pulse" />
              LIVE
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm border-0 text-white font-medium" data-testid={`badge-category-${id}`}>
              {category}
            </Badge>
          )}
        </div>

        {/* Viewer count */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-sm text-white font-semibold" data-testid={`text-viewer-count-${id}`}>
          <Users className="h-4 w-4" />
          {formatCount(viewerCount)}
        </div>

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 flex-shrink-0 ring-2 ring-red-500 ring-offset-2 ring-offset-background">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-red-400 to-pink-500 text-white font-semibold">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold line-clamp-1" data-testid={`text-stream-title-${id}`}>{title}</h3>
            <p className="text-sm text-muted-foreground font-medium" data-testid={`text-stream-creator-${id}`}>{creatorName}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LiveStreamSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-pink-100/50 dark:border-pink-900/30">
      <Skeleton className="aspect-video" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyLiveState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 flex items-center justify-center mb-5">
        <Radio className="h-10 w-10 text-red-400" />
      </div>
      <h3 className="font-bold text-lg mb-2" data-testid="text-empty-live">現在ライブ配信はありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        クリエイターが配信を開始するとここに表示されます
      </p>
    </motion.div>
  );
}

// Demo data for UI showcase
const demoLiveStreams: LiveStreamCardProps[] = [
  {
    id: "demo-1",
    title: "雑談配信 - みんなでおしゃべりしよう",
    creatorName: "Sakura",
    viewerCount: 1250,
    isLive: true,
    category: "雑談",
  },
  {
    id: "demo-2",
    title: "メイク配信 - 今日のメイクを紹介",
    creatorName: "Rina",
    viewerCount: 890,
    isLive: true,
    category: "美容",
  },
  {
    id: "demo-3",
    title: "ゲーム配信 - 新作ゲームをプレイ",
    creatorName: "Yuki",
    viewerCount: 2300,
    isLive: true,
    category: "ゲーム",
  },
  {
    id: "demo-4",
    title: "料理配信 - 簡単レシピを紹介",
    creatorName: "Miki",
    viewerCount: 560,
    isLive: true,
    category: "料理",
  },
];

export default function Live() {
  const [activeTab, setActiveTab] = useState("live");

  const { data: liveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/live"],
  });

  // Use demo data for UI showcase
  const displayStreams: LiveStreamCardProps[] = liveStreams && liveStreams.length > 0
    ? liveStreams.map(s => ({
        id: s.id,
        title: s.title,
        thumbnailUrl: s.thumbnailUrl,
        creatorName: "Creator",
        viewerCount: s.viewerCount || 0,
        isLive: s.status === "live",
        category: undefined,
      }))
    : demoLiveStreams;

  const activeStreams = displayStreams.filter(s => s.isLive);

  return (
    <div className="pb-24 min-h-screen bg-gradient-to-b from-background to-red-50/30 dark:to-red-950/10">
      {/* Featured live banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 p-4 text-white shadow-lg shadow-red-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-live-pulse" />
              ライブ配信中
            </p>
            <p className="text-xs text-white/80">{activeStreams.length}人のクリエイターが配信中</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-14 z-30 glass border-b border-border/30">
          <TabsList className="w-full h-14 bg-transparent rounded-none justify-start px-4 gap-6">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none px-0 pb-4 gap-2 text-base font-semibold"
              data-testid="tab-live-now"
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-live-pulse" />
              ライブ中
            </TabsTrigger>
            <TabsTrigger 
              value="scheduled" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-red-500 rounded-none px-0 pb-4 text-base font-semibold"
              data-testid="tab-scheduled"
            >
              予定
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="live" className="mt-0 p-4">
          {isLoading ? (
            <div className="space-y-4">
              <LiveStreamSkeleton />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <LiveStreamSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : activeStreams.length === 0 ? (
            <EmptyLiveState />
          ) : (
            <div className="space-y-4">
              {/* Featured stream */}
              {activeStreams.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <LiveStreamCard {...activeStreams[0]} />
                </motion.div>
              )}

              {/* Other streams */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeStreams.slice(1).map((stream, index) => (
                  <motion.div
                    key={stream.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index + 1) * 0.1 }}
                  >
                    <LiveStreamCard {...stream} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-0 p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-100 to-pink-100 dark:from-gray-800 dark:to-pink-900/30 flex items-center justify-center mb-5">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2" data-testid="text-empty-scheduled">予定されている配信はありません</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              クリエイターをフォローして、配信予定をチェックしよう
            </p>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
