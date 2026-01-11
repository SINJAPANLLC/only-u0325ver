import { motion } from "framer-motion";
import { Radio, Users, Clock, Play } from "lucide-react";
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
      className="group relative rounded-2xl overflow-hidden bg-card border border-card-border hover-elevate cursor-pointer"
      data-testid={`card-live-${id}`}
    >
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-pink-400/10 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-background/80 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-primary ml-0.5" fill="currentColor" />
          </div>
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isLive && (
            <Badge className="bg-red-500 border-0 text-white gap-1" data-testid={`badge-live-${id}`}>
              <span className="h-2 w-2 rounded-full bg-white animate-live-pulse" />
              LIVE
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="bg-black/50 border-0 text-white" data-testid={`badge-category-${id}`}>
              {category}
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white" data-testid={`text-viewer-count-${id}`}>
          <Users className="h-4 w-4" />
          {formatCount(viewerCount)}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-red-500 ring-offset-2 ring-offset-background">
            <AvatarImage src={creatorAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {creatorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-1" data-testid={`text-stream-title-${id}`}>{title}</h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-stream-creator-${id}`}>{creatorName}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LiveStreamSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-card-border">
      <Skeleton className="aspect-video" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Radio className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2" data-testid="text-empty-live">現在ライブ配信はありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        クリエイターが配信を開始するとここに表示されます
      </p>
    </div>
  );
}

export default function Live() {
  const [activeTab, setActiveTab] = useState("live");

  const { data: liveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/live"],
  });

  const displayStreams: LiveStreamCardProps[] = liveStreams
    ? liveStreams.map(s => ({
        id: s.id,
        title: s.title,
        thumbnailUrl: s.thumbnailUrl,
        creatorName: "Creator",
        viewerCount: s.viewerCount || 0,
        isLive: s.status === "live",
        category: undefined,
      }))
    : [];

  const activeStreams = displayStreams.filter(s => s.isLive);
  const scheduledStreams = displayStreams.filter(s => !s.isLive);

  return (
    <div className="pb-20">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border/50">
          <TabsList className="w-full h-12 bg-transparent rounded-none justify-start px-4 gap-4">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 gap-2"
              data-testid="tab-live-now"
            >
              <span className="h-2 w-2 rounded-full bg-red-500 animate-live-pulse" />
              ライブ中
            </TabsTrigger>
            <TabsTrigger 
              value="scheduled" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3"
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
            <>
              {activeStreams.length > 0 && (
                <div className="mb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <LiveStreamCard {...activeStreams[0]} />
                  </motion.div>
                </div>
              )}

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
            </>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-0 p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : scheduledStreams.length > 0 ? (
            <div className="space-y-4">
              {scheduledStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl bg-card border border-card-border p-4"
                  data-testid={`card-scheduled-${stream.id}`}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={stream.creatorAvatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {stream.creatorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold" data-testid={`text-scheduled-title-${stream.id}`}>{stream.title}</h3>
                      <p className="text-sm text-muted-foreground">{stream.creatorName}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          予定
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Radio className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2" data-testid="text-empty-scheduled">予定されている配信はありません</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                クリエイターをフォローして、配信予定をチェックしよう
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
