import { useLocation } from "wouter";
import { ArrowLeft, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      followerCount: creator?.followerCount || 0,
      isVerified: creator?.isVerified || false,
    };
  });

  return (
    <div className="h-full bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">フォロー中</h1>
        </div>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : followedCreators.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">まだ誰もフォローしていません</p>
            <Button 
              className="mt-4"
              onClick={() => setLocation("/")}
            >
              クリエイターを探す
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {followedCreators.map((creator) => (
              <div 
                key={creator.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                data-testid={`following-item-${creator.id}`}
              >
                <Avatar 
                  className="h-12 w-12 cursor-pointer"
                  onClick={() => setLocation(`/creator/${creator.id}`)}
                >
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
                    {creator.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => setLocation(`/creator/${creator.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{creator.displayName}</p>
                    {creator.isVerified && (
                      <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-500 text-[10px]">
                        認証済み
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{creator.bio}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {creator.followerCount.toLocaleString()} フォロワー
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unfollowMutation.mutate(creator.id)}
                  disabled={unfollowMutation.isPending}
                  data-testid={`button-unfollow-${creator.id}`}
                >
                  {unfollowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserMinus className="h-4 w-4 mr-1" />
                      解除
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
