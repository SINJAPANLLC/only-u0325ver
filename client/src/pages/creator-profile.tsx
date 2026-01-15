import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MoreHorizontal, Share2, Grid3X3, PlaySquare, Bookmark, Heart, MessageCircle, UserPlus, Check, Loader2, Crown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreatorProfile as CreatorProfileType, Video, Subscription, SubscriptionPlan } from "@shared/schema";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/nude_shower_4.jpg";
import img4 from "@assets/generated_images/lingerie_bed_3.jpg";

const demoCreatorData: Record<string, {
  name: string;
  displayName: string;
  avatar: string;
  cover: string;
  bio: string;
  followers: number;
  following: number;
  likes: number;
  posts: number;
  isVerified: boolean;
  videos: { id: string; thumbnail: string; views: number; likes: number }[];
}> = {
  "Risa": {
    name: "Risa",
    displayName: "りさ💋",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    cover: img1,
    bio: "大人の魅力をお届け💕\n毎晩22時から配信中🌙\nリクエストお待ちしてます✨",
    followers: 125400,
    following: 48,
    likes: 2850000,
    posts: 342,
    isVerified: true,
    videos: [
      { id: "v1", thumbnail: img1, views: 285000, likes: 24800 },
      { id: "v2", thumbnail: img2, views: 156000, likes: 18200 },
      { id: "v3", thumbnail: img3, views: 98000, likes: 12400 },
      { id: "v4", thumbnail: img4, views: 76000, likes: 8900 },
    ]
  },
  "Yua": {
    name: "Yua",
    displayName: "ゆあ🖤",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
    cover: img2,
    bio: "VIP限定コンテンツ多数💎\nベッドルームからお届け🛏️\nDM返信率100%💌",
    followers: 89200,
    following: 32,
    likes: 1920000,
    posts: 256,
    isVerified: true,
    videos: [
      { id: "v1", thumbnail: img2, views: 456000, likes: 38200 },
      { id: "v2", thumbnail: img1, views: 234000, likes: 21500 },
    ]
  },
  "Mio": {
    name: "Mio",
    displayName: "みお🛁",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=face",
    cover: img3,
    bio: "お風呂配信専門🧼\nギリギリを攻めます💦\n毎週金曜深夜スペシャル🔥",
    followers: 67800,
    following: 21,
    likes: 1340000,
    posts: 189,
    isVerified: true,
    videos: [
      { id: "v1", thumbnail: img3, views: 198000, likes: 16700 },
      { id: "v2", thumbnail: img4, views: 145000, likes: 12100 },
    ]
  }
};

const defaultDemoCreator = {
  name: "Creator",
  displayName: "クリエイター",
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
  cover: img1,
  bio: "Only-Uクリエイター💕",
  followers: 10000,
  following: 50,
  likes: 100000,
  posts: 50,
  isVerified: false,
  videos: [
    { id: "v1", thumbnail: img1, views: 10000, likes: 1000 },
  ]
};

const DEFAULT_SUBSCRIPTION_PRICE = 500;

export default function CreatorProfile() {
  const [, params] = useRoute("/creator/:username");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  const creatorId = params?.username || "";
  const isRealCreator = creatorId && !demoCreatorData[creatorId];
  
  const { data: creatorProfile } = useQuery<CreatorProfileType>({
    queryKey: ["/api/creators", creatorId],
    enabled: Boolean(isRealCreator),
  });

  const { data: creatorVideos } = useQuery<Video[]>({
    queryKey: ["/api/creators", creatorId, "videos"],
    enabled: Boolean(isRealCreator),
  });

  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: ["/api/follow", creatorId],
    enabled: Boolean(user && isRealCreator),
  });

  const { data: subscriptionStatus } = useQuery<{ isSubscribed: boolean; subscription?: Subscription }>({
    queryKey: ["/api/subscription", creatorId],
    enabled: Boolean(user && creatorId),
  });

  const { data: subscriptionPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans", creatorId],
    enabled: Boolean(creatorId),
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/follow/${creatorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/creators", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/follow/${creatorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/follow", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/creators", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId?: string) => {
      await apiRequest("POST", `/api/subscription/${creatorId}`, {
        planId,
        planType: "monthly",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setShowSubscribeDialog(false);
      toast({
        title: "登録完了",
        description: "プレミアムコンテンツにアクセスできるようになりました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "登録に失敗しました",
        variant: "destructive",
      });
    },
  });

  const [localIsFollowing, setLocalIsFollowing] = useState(false);
  const [localIsSubscribed, setLocalIsSubscribed] = useState(false);

  useEffect(() => {
    if (followStatus) {
      setLocalIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus]);

  useEffect(() => {
    if (subscriptionStatus) {
      setLocalIsSubscribed(subscriptionStatus.isSubscribed);
    }
  }, [subscriptionStatus]);
  
  const demoCreator = demoCreatorData[creatorId] || defaultDemoCreator;
  
  const creator = isRealCreator && creatorProfile ? {
    name: creatorProfile.userId,
    displayName: creatorProfile.displayName,
    avatar: demoCreator.avatar,
    cover: creatorProfile.coverImageUrl || demoCreator.cover,
    bio: creatorProfile.bio || "",
    followers: creatorProfile.followerCount || 0,
    following: creatorProfile.followingCount || 0,
    likes: 0,
    posts: creatorProfile.postCount || 0,
    isVerified: creatorProfile.isVerified || false,
    videos: (creatorVideos || []).map((v, i) => ({
      id: v.id,
      thumbnail: v.thumbnailUrl || demoCreator.videos[i % demoCreator.videos.length]?.thumbnail || img1,
      views: v.viewCount || 0,
      likes: v.likeCount || 0,
    }))
  } : demoCreator;
  
  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  const handleBack = () => {
    setLocation("/");
  };

  const handleFollowToggle = async () => {
    if (!user) {
      setLocation("/auth");
      return;
    }

    if (isRealCreator) {
      if (localIsFollowing) {
        setLocalIsFollowing(false);
        unfollowMutation.mutate();
      } else {
        setLocalIsFollowing(true);
        followMutation.mutate();
      }
    } else {
      setLocalIsFollowing(!localIsFollowing);
    }
  };

  const isFollowing = isRealCreator ? localIsFollowing : localIsFollowing;
  const isSubscribed = localIsSubscribed;
  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  const isSubscribeLoading = subscribeMutation.isPending;

  const handleMessage = () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setLocation("/messages");
  };

  const handleSubscribe = () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setShowSubscribeDialog(true);
  };

  const confirmSubscribe = () => {
    subscribeMutation.mutate(selectedPlanId || undefined);
  };

  const getSelectedPlan = () => {
    if (!selectedPlanId || !subscriptionPlans) return null;
    return subscriptionPlans.find(p => p.id === selectedPlanId);
  };

  const getSubscriptionPrice = () => {
    const plan = getSelectedPlan();
    return plan?.price || DEFAULT_SUBSCRIPTION_PRICE;
  };
  
  return (
    <motion.div 
      className="h-full bg-background overflow-y-auto scrollbar-hide"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      <div className="relative">
        <div className="h-44 relative">
          <img 
            src={creator.cover} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
          
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 z-10">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
                data-testid="button-more"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="relative px-4 -mt-12">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-2xl font-bold">
                {creator.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{creator.displayName}</h1>
                {creator.isVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 text-xs font-medium">
                    認証済み
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">@{creator.name}</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm whitespace-pre-line">{creator.bio}</p>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-bold">{formatCount(creator.followers)}</p>
              <p className="text-xs text-muted-foreground">フォロワー</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{creator.following}</p>
              <p className="text-xs text-muted-foreground">フォロー中</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{formatCount(creator.likes)}</p>
              <p className="text-xs text-muted-foreground">いいね</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              className={`flex-1 ${isFollowing ? "bg-secondary text-foreground" : "bg-pink-500 hover:bg-pink-600 text-white"}`}
              onClick={handleFollowToggle}
              disabled={isLoading}
              data-testid="button-follow-toggle"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  フォロー中
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  フォロー
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleMessage} data-testid="button-message">
              <MessageCircle className="h-4 w-4 mr-2" />
              メッセージ
            </Button>
          </div>
          
          <Button 
            className={`w-full mt-3 ${isSubscribed ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white" : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"}`}
            onClick={handleSubscribe}
            disabled={isSubscribed || isSubscribeLoading}
            data-testid="button-subscribe"
          >
            {isSubscribeLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <>
                <Crown className="h-4 w-4 mr-2" />
                プレミアム会員（Tier {subscriptionStatus?.subscription?.tier || 1}）
              </>
            ) : (
              <>
                <Crown className="h-4 w-4 mr-2" />
                {subscriptionPlans && subscriptionPlans.length > 0 
                  ? `登録する（${subscriptionPlans[0].price.toLocaleString()}pt〜/月）`
                  : `登録する（${DEFAULT_SUBSCRIPTION_PRICE}pt/月）`
                }
              </>
            )}
          </Button>
        </div>

        <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>プレミアム登録</DialogTitle>
              <DialogDescription>
                {creator.displayName}のプレミアムコンテンツにアクセスできるようになります
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              {subscriptionPlans && subscriptionPlans.length > 0 ? (
                subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedPlanId === plan.id
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-muted bg-muted hover:border-pink-300"
                    }`}
                    data-testid={`plan-option-${plan.tier}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{plan.name}</p>
                        {plan.tier === 3 && (
                          <span className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-2 py-0.5 rounded">VIP</span>
                        )}
                        {plan.tier === 2 && (
                          <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded">人気</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-pink-500">{plan.price.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">pt/月</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">月額プラン</p>
                    <p className="text-sm text-muted-foreground">30日間のアクセス</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-pink-500">{DEFAULT_SUBSCRIPTION_PRICE}</p>
                    <p className="text-xs text-muted-foreground">ポイント/月</p>
                  </div>
                </div>
              )}
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  ポイントが即座に消費されます
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSubscribeDialog(false)}>
                キャンセル
              </Button>
              <Button 
                onClick={confirmSubscribe}
                disabled={isSubscribeLoading || (subscriptionPlans && subscriptionPlans.length > 0 && !selectedPlanId)}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {isSubscribeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                登録する（{getSubscriptionPrice().toLocaleString()}pt）
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Tabs defaultValue="videos" className="mt-6">
          <TabsList className="w-full bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="videos" 
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none"
            >
              <Grid3X3 className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="liked" 
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none"
            >
              <Heart className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none"
            >
              <Bookmark className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="mt-0">
            <div className="grid grid-cols-3 gap-0.5">
              {creator.videos.map((video) => (
                <div 
                  key={video.id} 
                  className="aspect-[9/16] relative bg-muted"
                  data-testid={`video-thumbnail-${video.id}`}
                >
                  <img 
                    src={video.thumbnail} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs">
                    <PlaySquare className="h-3 w-3" />
                    <span>{formatCount(video.views)}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="liked" className="mt-0">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              いいねした動画はここに表示されます
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-0">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              保存した動画はここに表示されます
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="h-24" />
    </motion.div>
  );
}
