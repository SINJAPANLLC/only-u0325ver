import { useLocation } from "wouter";
import { ArrowLeft, UserMinus, Loader2, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Follow, CreatorProfile } from "@shared/schema";

export default function Following() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: following, isLoading } = useQuery<Follow[]>({
    queryKey: ["/api/following"],
    enabled: !!user,
  });

  const { data: creators } = useQuery<CreatorProfile[]>({
    queryKey: ["/api/creators"],
  });

  const unfollowMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      await apiRequest("DELETE", `/api/follow/${creatorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
    },
  });

  const followedCreators = (following || []).map(f => {
    const creator = (creators || []).find(c => c.userId === f.followingId);
    return {
      id: f.followingId,
      displayName: creator?.displayName || "クリエイター",
      bio: creator?.bio || "",
      avatarUrl: (creator as any)?.avatarUrl || undefined,
      followerCount: creator?.followerCount || 0,
      isVerified: creator?.isVerified || false,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-base leading-tight">フォロー中</h1>
            {followedCreators.length > 0 && (
              <p className="text-[11px] text-muted-foreground leading-tight">{followedCreators.length}人</p>
            )}
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/30 animate-pulse">
                <div className="h-14 w-14 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded-lg w-1/2" />
                  <div className="h-3 bg-muted rounded-lg w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : followedCreators.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-5">
              <Users className="h-10 w-10 text-pink-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">まだフォローしていません</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
              クリエイターをフォローして最新の投稿を受け取りましょう
            </p>
            <Button
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl px-6"
              onClick={() => setLocation("/")}
            >
              クリエイターを探す
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {followedCreators.map((creator, index) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/30 cursor-pointer hover:bg-accent/30 transition-colors active:scale-[0.98]"
                onClick={() => setLocation(`/creator/${creator.id}`)}
                data-testid={`following-item-${creator.id}`}
              >
                <Avatar className="h-14 w-14 flex-shrink-0">
                  <AvatarImage src={creator.avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-lg font-bold">
                    {creator.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-semibold text-sm truncate">{creator.displayName}</h3>
                    {creator.isVerified && (
                      <svg className="h-4 w-4 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </div>
                  {creator.bio && (
                    <p className="text-xs text-muted-foreground truncate">{creator.bio}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    フォロワー {creator.followerCount.toLocaleString()}人
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 rounded-xl text-xs border-border/40 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-950/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      unfollowMutation.mutate(creator.id);
                    }}
                    disabled={unfollowMutation.isPending}
                    data-testid={`button-unfollow-${creator.id}`}
                  >
                    {unfollowMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "フォロー解除"
                    )}
                  </Button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
