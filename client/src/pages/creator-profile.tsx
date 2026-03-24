import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MoreHorizontal, Share2, Grid3X3, Heart, MessageCircle, Check, Loader2, Crown, Lock, X, ShoppingBag, ChevronDown, Link as LinkIcon, Flag, Ban, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { CreatorProfile as CreatorProfileType, Video, Subscription, SubscriptionPlan, Product } from "@shared/schema";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/nude_shower_4.jpg";
import img4 from "@assets/generated_images/lingerie_bed_3.jpg";
import logoImage from "@assets/IMG_9769_1768973936225.PNG";

type DemoProduct = { id: string; name: string; price: number; imageUrl: string; productType: "digital" | "physical"; description?: string };

const demoCreatorData: Record<string, {
  name: string;
  displayName: string;
  avatar: string;
  cover: string;
  bio: string;
  externalLink?: string;
  followers: number;
  following: number;
  likes: number;
  posts: number;
  isVerified: boolean;
  videos: { id: string; thumbnail: string; videoUrl?: string; views: number; likes: number; requiredTier?: number }[];
  products: DemoProduct[];
}> = {
  "Risa": {
    name: "Risa",
    displayName: "りさ",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    cover: img1,
    bio: "大人の魅力をお届け\n毎晩22時から配信中\nリクエストお待ちしてます",
    followers: 125400,
    following: 48,
    likes: 2850000,
    posts: 342,
    isVerified: true,
    videos: [
      { id: "v1", thumbnail: img1, views: 285000, likes: 24800, requiredTier: 0 },
      { id: "v2", thumbnail: img2, views: 156000, likes: 18200, requiredTier: 1 },
      { id: "v3", thumbnail: img3, views: 98000, likes: 12400, requiredTier: 2 },
      { id: "v4", thumbnail: img4, views: 76000, likes: 8900, requiredTier: 3 },
    ],
    products: [
      { id: "demo-p1", name: "限定デジタル写真集 Vol.1", price: 3000, imageUrl: img1, productType: "digital" },
      { id: "demo-p2", name: "サイン入りチェキ", price: 5000, imageUrl: img2, productType: "physical" },
    ]
  },
  "Yua": {
    name: "Yua",
    displayName: "ゆあ",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
    cover: img2,
    bio: "VIP限定コンテンツ多数\nベッドルームからお届け\nDM返信率100%",
    followers: 89200,
    following: 32,
    likes: 1920000,
    posts: 256,
    isVerified: true,
    videos: [
      { id: "v1", thumbnail: img2, views: 456000, likes: 38200, requiredTier: 0 },
      { id: "v2", thumbnail: img1, views: 234000, likes: 21500, requiredTier: 2 },
    ],
    products: [
      { id: "demo-p3", name: "おやすみボイスメッセージ", price: 2000, imageUrl: img3, productType: "digital" },
    ]
  },
  "Mio": {
    name: "Mio",
    displayName: "みお",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=face",
    cover: img3,
    bio: "お風呂配信専門\nギリギリを攻めます\n毎週金曜深夜スペシャル",
    followers: 67800,
    following: 21,
    likes: 1340000,
    posts: 189,
    isVerified: true,
    videos: [
      { id: "v1", thumbnail: img3, views: 198000, likes: 16700, requiredTier: 0 },
      { id: "v2", thumbnail: img4, views: 145000, likes: 12100, requiredTier: 1 },
    ],
    products: [
      { id: "demo-p4", name: "オリジナルTシャツ", price: 4500, imageUrl: img4, productType: "physical" },
    ]
  }
};

const defaultDemoCreator = {
  name: "Creator",
  displayName: "クリエイター",
  avatar: "",
  cover: img1,
  bio: "Only-Uクリエイター",
  externalLink: "",
  followers: 10000,
  following: 50,
  likes: 100000,
  posts: 50,
  isVerified: false,
  videos: [
    { id: "v1", thumbnail: img1, views: 10000, likes: 1000, requiredTier: 0 },
    { id: "v2", thumbnail: img2, views: 8000, likes: 800, requiredTier: 1 },
  ],
  products: [] as DemoProduct[]
};

const DEFAULT_SUBSCRIPTION_PRICE = 500;

export default function CreatorProfile() {
  const [, params] = useRoute("/creator/:username");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; videoUrl: string; thumbnail: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    postalCode: "",
    address: "",
    phone: "",
  });
  
  const creatorId = params?.username || "";
  const isRealCreator = creatorId && !demoCreatorData[creatorId];
  
  const { data: creatorProfile, isLoading: isLoadingCreator } = useQuery<CreatorProfileType>({
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

  const { data: subscriptionStatus } = useQuery<{ 
    isSubscribed: boolean; 
    subscription?: Subscription; 
    subscriptions?: Subscription[];
    subscribedPlanIds?: (string | null)[];
    subscriptionDetails?: { planId: string | null; autoRenew: boolean | null; expiresAt: Date | string | null }[];
  }>({
    queryKey: ["/api/subscription", creatorId],
    enabled: Boolean(user && creatorId),
  });

  const { data: subscriptionPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans", creatorId],
    enabled: Boolean(creatorId),
  });

  const { data: creatorProducts } = useQuery<Product[]>({
    queryKey: ["/api/creators", creatorId, "products"],
    enabled: Boolean(isRealCreator),
  });

  const { data: likedVideos } = useQuery<{
    id: string;
    title: string;
    thumbnailUrl: string | null;
    videoUrl: string;
    viewCount: number;
    likeCount: number;
    creatorDisplayName: string | null;
  }[]>({
    queryKey: ["/api/creators", creatorId, "likes"],
    enabled: Boolean(isRealCreator),
  });

  const { data: userData } = useQuery<{ points: number }>({
    queryKey: ["/api/user/points"],
    enabled: !!user,
  });

  const userPoints = userData?.points ?? 0;

  const purchaseMutation = useMutation({
    mutationFn: async ({ productId, shipping }: { 
      productId: string; 
      shipping?: { 
        shippingName: string; 
        shippingPostalCode: string; 
        shippingAddress: string; 
        shippingPhone: string; 
      } 
    }) => {
      const res = await apiRequest("POST", `/api/products/${productId}/purchase`, shipping);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      setProductDetailOpen(false);
      setSelectedProduct(null);
      setShippingInfo({ name: "", postalCode: "", address: "", phone: "" });
      toast({ title: "購入完了", description: "商品を購入しました！メッセージに詳細が届きます。" });
    },
    onError: (error: any) => {
      toast({ title: "購入エラー", description: error.message || "購入に失敗しました", variant: "destructive" });
    },
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

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("DELETE", `/api/subscription/${creatorId}/${planId}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      const expiresAt = data.expiresAt ? new Date(data.expiresAt).toLocaleDateString('ja-JP') : null;
      toast({
        title: "自動更新を停止しました",
        description: expiresAt 
          ? `${expiresAt}まで視聴できます。期限後は更新されません。` 
          : "期限まで視聴できます。期限後は更新されません。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "自動更新の停止に失敗しました",
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
  
  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  
  const creator = isRealCreator && creatorProfile ? {
    name: (creatorProfile as any).username && !isUUID((creatorProfile as any).username) 
      ? (creatorProfile as any).username 
      : (creatorProfile.displayName || "ユーザー"),
    displayName: creatorProfile.displayName || (creatorProfile as any).username || "ユーザー",
    avatar: (creatorProfile as any).avatarUrl || logoImage,
    cover: creatorProfile.coverImageUrl || demoCreator.cover,
    bio: creatorProfile.bio || "",
    externalLink: (creatorProfile as any).externalLink || "",
    followers: creatorProfile.followerCount || 0,
    following: creatorProfile.followingCount || 0,
    likes: (creatorVideos || []).reduce((sum, v) => sum + (v.likeCount || 0), 0),
    posts: creatorProfile.postCount || 0,
    isVerified: creatorProfile.isVerified || false,
    videos: (creatorVideos || []).map((v, i) => ({
      id: v.id,
      thumbnail: v.thumbnailUrl || demoCreator.videos[i % demoCreator.videos.length]?.thumbnail || img1,
      videoUrl: v.videoUrl || "",
      views: v.viewCount || 0,
      likes: v.likeCount || 0,
      requiredTier: v.requiredTier || 0,
    })),
    products: [] as DemoProduct[]
  } : demoCreator;
  
  // Get products to display - real products for real creators, demo for demo creators
  const displayProducts = isRealCreator 
    ? (creatorProducts || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl || img1,
        productType: (p.productType || "digital") as "digital" | "physical",
        description: p.description || undefined
      }))
    : demoCreator.products;
  
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

  const isFollowing = localIsFollowing;
  const isSubscribed = localIsSubscribed;
  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  const isSubscribeLoading = subscribeMutation.isPending;
  const isLive = false;

  const handleMessage = async () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    try {
      const res = await apiRequest("POST", "/api/conversations", { participantId: creatorId });
      const conversation = await res.json();
      setLocation(`/conversation/${conversation.id}`);
    } catch (error) {
      toast({
        title: "エラー",
        description: "メッセージを開始できませんでした",
        variant: "destructive",
      });
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setShowSubscribeDialog(true);
  };

  const confirmSubscribe = () => {
    const price = getSubscriptionPrice();
    if (userPoints < price) {
      setShowSubscribeDialog(false);
      toast({
        title: "ポイント不足",
        description: "ポイント購入ページに移動します",
      });
      setLocation("/points-purchase");
      return;
    }
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

  const userTier = subscriptionStatus?.subscription?.tier || 0;
  
  const hasAccessToVideo = (requiredTier: number) => {
    if (requiredTier === 0) return true;
    return userTier >= requiredTier;
  };

  const getPlanNameByTier = (tier: number): string => {
    if (subscriptionPlans && subscriptionPlans.length > 0) {
      const plan = subscriptionPlans.find(p => p.tier === tier);
      if (plan) return plan.name;
    }
    const defaultNames: Record<number, string> = {
      1: "ベーシック",
      2: "スタンダード", 
      3: "プレミアム"
    };
    return defaultNames[tier] || `Tier ${tier}`;
  };

  const handleVideoClick = (video: { id: string; videoUrl: string; thumbnail: string; requiredTier: number }) => {
    if (!hasAccessToVideo(video.requiredTier)) {
      setShowSubscribeDialog(true);
      return;
    }
    setSelectedVideo({ id: video.id, videoUrl: video.videoUrl, thumbnail: video.thumbnail });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${creator.displayName} - Only-U`,
          text: `${creator.displayName}のプロフィールをチェック！`,
          url: url,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "リンクをコピーしました" });
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "リンクをコピーしました" });
  };

  const handleReport = () => {
    toast({ title: "報告を受け付けました", description: "確認後、対応いたします。" });
  };

  const handleBlock = () => {
    toast({ title: "ブロックしました", description: `${creator.displayName}をブロックしました。` });
  };

  // Show loading state
  if (isRealCreator && isLoadingCreator) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <motion.div 
      className="h-full bg-black text-white overflow-y-auto scrollbar-hide"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-2 py-3 border-b border-white/10 sticky top-0 z-20 bg-black/90 backdrop-blur-xl">
        <Button 
          size="icon" 
          variant="ghost"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={handleBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost"
            className="h-9 w-9 text-white hover:bg-white/10"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost"
                className="h-9 w-9 text-white hover:bg-white/10"
                data-testid="button-more"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyLink}>
                <LinkIcon className="h-4 w-4 mr-2" />
                リンクをコピー
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="h-4 w-4 mr-2" />
                報告する
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock}>
                <Ban className="h-4 w-4 mr-2" />
                ブロックする
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center px-4 pt-6">
        {/* Avatar */}
        <div className="relative">
          <Avatar className={`h-28 w-28 shadow-xl overflow-hidden ${(creatorProfile as any)?.isCreator ? 'ring-4 ring-pink-500' : ''}`}>
            <AvatarImage 
              src={creator.avatar || logoImage} 
              className="object-cover w-full h-full"
            />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-3xl font-bold">
              {creator.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {isLive && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
              LIVE
            </div>
          )}
        </div>

        {/* Username */}
        <div className="flex items-center gap-2 mt-4">
          <h1 className="text-lg font-bold flex items-center gap-1">
            {creator.displayName}
            {creator.isVerified && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 text-xs font-medium">
                認証済み
              </span>
            )}
          </h1>
        </div>


        {/* Likes count */}
        <div className="flex items-center justify-center mt-4">
          <div className="text-center">
            <p className="text-lg font-bold">{formatCount(creator.likes)}</p>
            <p className="text-xs text-white/50">いいね</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="w-full mt-4 text-center">
          <p className="text-sm font-medium whitespace-pre-line">{creator.bio}</p>
          {creator.externalLink && (
            <a 
              href={creator.externalLink.startsWith('http') ? creator.externalLink : `https://${creator.externalLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-pink-500 hover:underline mt-1 inline-flex items-center gap-1"
              data-testid="link-external"
            >
              <LinkIcon className="h-3 w-3" />
              {creator.externalLink.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-5 space-y-2">
          <div className="flex gap-2">
            {subscriptionPlans && subscriptionPlans.length > 0 && (
              <Button 
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
                onClick={handleSubscribe}
                disabled={isSubscribeLoading}
                data-testid="button-subscribe"
              >
                {isSubscribeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    サブスク登録
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent"
              onClick={handleMessage}
              data-testid="button-message"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              メッセージ
            </Button>
          </div>
        </div>
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
                subscriptionPlans.map((plan) => {
                  const isAlreadySubscribed = subscriptionStatus?.subscribedPlanIds?.includes(plan.id);
                  return (
                    <div
                      key={plan.id}
                      onClick={() => !isAlreadySubscribed && setSelectedPlanId(plan.id)}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all border-2 ${
                        isAlreadySubscribed
                          ? "border-pink-500 bg-pink-500/10 cursor-default"
                          : selectedPlanId === plan.id
                          ? "border-pink-500 bg-pink-500/10 cursor-pointer"
                          : "border-muted bg-muted hover:border-pink-300 cursor-pointer"
                      }`}
                      data-testid={`plan-option-${plan.tier}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{plan.name}</p>
                          {isAlreadySubscribed && (
                            <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              加入中
                            </span>
                          )}
                          {!isAlreadySubscribed && plan.tier === 3 && (
                            <span className="text-xs bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-2 py-0.5 rounded">VIP</span>
                          )}
                          {!isAlreadySubscribed && plan.tier === 2 && (
                            <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded">人気</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        {isAlreadySubscribed && (() => {
                          const details = subscriptionStatus?.subscriptionDetails?.find((d: any) => d.planId === plan.id);
                          const autoRenew = details?.autoRenew !== false;
                          const expiresAt = details?.expiresAt ? new Date(details.expiresAt) : null;
                          
                          return (
                            <div className="mt-2">
                              {expiresAt && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {autoRenew ? "次回更新日" : "期限"}: {expiresAt.toLocaleDateString('ja-JP')}
                                </p>
                              )}
                              {autoRenew ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 p-0 h-auto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("このプランの自動更新を停止しますか？期限まで視聴できます。")) {
                                      cancelSubscriptionMutation.mutate(plan.id);
                                    }
                                  }}
                                  disabled={cancelSubscriptionMutation.isPending}
                                  data-testid={`button-cancel-subscription-${plan.tier}`}
                                >
                                  {cancelSubscriptionMutation.isPending ? "処理中..." : "自動更新を停止"}
                                </Button>
                              ) : (
                                <span className="text-xs text-orange-500">自動更新停止中</span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-pink-500">{plan.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">pt/月</p>
                      </div>
                    </div>
                  );
                })
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
                <p>ポイントが即座に消費されます</p>
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
        
      {/* Content Tabs */}
      <Tabs defaultValue="videos" className="mt-2">
        <TabsList className="w-full bg-transparent border-b border-white/10 rounded-none h-12 justify-start px-2">
          <TabsTrigger 
            value="videos" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 data-[state=active]:border-b-pink-500 text-white/50 data-[state=active]:text-white rounded-none h-full bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-videos"
          >
            <div className="flex items-center gap-1">
              <Grid3X3 className="h-5 w-5" />
              <ChevronDown className="h-3 w-3" />
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="shop" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 text-white/50 data-[state=active]:text-white rounded-none h-full bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-shop"
          >
            <ShoppingBag className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger 
            value="liked" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 text-white/50 data-[state=active]:text-white rounded-none h-full bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            data-testid="tab-liked"
          >
            <Heart className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>
          
          <TabsContent value="videos" className="mt-0">
            {creator.videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Grid3X3 className="h-12 w-12" />
                <p>コンテンツがありません</p>
              </div>
            ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {creator.videos.map((video) => {
                const canAccess = hasAccessToVideo(video.requiredTier || 0);
                return (
                  <div 
                    key={video.id} 
                    className="aspect-[9/16] relative bg-muted cursor-pointer"
                    onClick={() => handleVideoClick({ id: video.id, videoUrl: video.videoUrl || "", thumbnail: video.thumbnail, requiredTier: video.requiredTier || 0 })}
                    data-testid={`video-thumbnail-${video.id}`}
                  >
                    <img 
                      src={video.thumbnail} 
                      alt="" 
                      className={`absolute inset-0 w-full h-full object-cover ${!canAccess ? 'blur-lg' : ''}`}
                    />
                    <div className="absolute top-1 right-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        (video.requiredTier || 0) === 0 
                          ? "bg-pink-300 text-white" 
                          : "bg-pink-500 text-white"
                      }`}>
                        {(video.requiredTier || 0) === 0 ? "FREE" : getPlanNameByTier(video.requiredTier || 1)}
                      </span>
                    </div>
                    {!canAccess && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="flex flex-col items-center text-white">
                          <Lock className="h-6 w-6 mb-1" />
                          <span className="text-xs">{getPlanNameByTier(video.requiredTier || 1)}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs">
                      <Heart className="h-3 w-3" />
                      <span>{formatCount(video.likes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </TabsContent>
          
          <TabsContent value="liked" className="mt-0">
            {likedVideos && likedVideos.length > 0 ? (
              <div className="grid grid-cols-3 gap-0.5">
                {likedVideos.map((video) => (
                  <div 
                    key={video.id}
                    className="aspect-[9/16] relative overflow-hidden group cursor-pointer"
                    onClick={() => setSelectedVideo({ id: video.id, videoUrl: video.videoUrl, thumbnail: video.thumbnailUrl || "" })}
                    data-testid={`liked-video-${video.id}`}
                  >
                    <img 
                      src={video.thumbnailUrl || ""} 
                      alt="いいねした動画"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-xs mb-1">{video.creatorDisplayName || "クリエイター"}</p>
                      <div className="flex items-center gap-3 text-white/90 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-current text-pink-400" />
                          {video.likeCount >= 10000 ? `${(video.likeCount / 10000).toFixed(1)}万` : video.likeCount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Heart className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">いいねした動画はありません</p>
              </div>
            )}
          </TabsContent>
          
        <TabsContent value="shop" className="mt-0">
            <div className="grid grid-cols-2 gap-0.5">
              {displayProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="aspect-[9/16] relative overflow-hidden group cursor-pointer"
                  onClick={() => {
                    if (isRealCreator) {
                      const realProduct = creatorProducts?.find(p => p.id === product.id);
                      if (realProduct) {
                        setSelectedProduct(realProduct);
                        setProductDetailOpen(true);
                      }
                    } else {
                      toast({ title: "デモ商品", description: "これはデモ商品です。実際の購入はできません。" });
                    }
                  }}
                  data-testid={`product-card-${product.id}`}
                >
                  <img 
                    src={product.imageUrl || img1} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                      {product.productType === "digital" ? "デジタル" : "物販"}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white font-bold text-sm truncate">{product.name}</p>
                    <p className="text-pink-400 font-bold text-xs">{product.price.toLocaleString()}pt</p>
                  </div>
                </div>
              ))}
              {displayProducts.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <ShoppingBag className="h-10 w-10 mb-2 opacity-50" />
                  <p>商品はまだありません</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

      {selectedVideo && (
        <div className="fixed inset-0 z-[99999] bg-black flex flex-col">
          <div className="absolute top-3 left-3 z-[100000]">
            <Button
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full bg-white/20 text-white"
              onClick={() => setSelectedVideo(null)}
              data-testid="button-close-video"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="w-full h-full flex items-center justify-center">
            {selectedVideo.videoUrl ? (
              <video
                src={selectedVideo.videoUrl}
                className="h-full w-auto max-w-full object-contain"
                controls
                autoPlay
                playsInline
                data-testid="video-player"
              />
            ) : (
              <img
                src={selectedVideo.thumbnail}
                alt=""
                className="h-full w-auto max-w-full object-contain"
                data-testid="image-viewer"
              />
            )}
          </div>
        </div>
      )}
      
      <div className="h-24" />

      {/* Product Detail Modal with Purchase */}
      <Dialog open={productDetailOpen} onOpenChange={setProductDetailOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="aspect-square relative rounded-lg overflow-hidden">
                  <img 
                    src={selectedProduct.imageUrl || img1} 
                    alt={selectedProduct.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-bold text-white">
                      {selectedProduct.productType === "digital" ? "デジタル" : "物販"}
                    </span>
                  </div>
                </div>
                
                {selectedProduct.description && (
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                )}
                
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">現在の保有ポイント</span>
                    <span className="font-medium">{userPoints.toLocaleString()}pt</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">購入後の残高</span>
                    <span className={`font-medium ${userPoints < selectedProduct.price ? "text-destructive" : ""}`}>
                      {(userPoints - selectedProduct.price).toLocaleString()}pt
                    </span>
                  </div>
                </div>
                
                {userPoints < selectedProduct.price && (
                  <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                    ポイントが不足しています。ポイントをチャージしてください。
                  </div>
                )}

                {selectedProduct.productType === "physical" && userPoints >= selectedProduct.price && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Truck className="h-4 w-4" />
                      配送先情報
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="shipping-name-creator" className="text-xs">お名前 *</Label>
                        <Input
                          id="shipping-name-creator"
                          value={shippingInfo.name}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                          placeholder="山田 太郎"
                          className="h-9"
                          data-testid="input-shipping-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-postal-creator" className="text-xs">郵便番号 *</Label>
                        <Input
                          id="shipping-postal-creator"
                          value={shippingInfo.postalCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                          placeholder="123-4567"
                          className="h-9"
                          data-testid="input-shipping-postal"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-address-creator" className="text-xs">住所 *</Label>
                        <Input
                          id="shipping-address-creator"
                          value={shippingInfo.address}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                          placeholder="東京都渋谷区..."
                          className="h-9"
                          data-testid="input-shipping-address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shipping-phone-creator" className="text-xs">電話番号 *</Label>
                        <Input
                          id="shipping-phone-creator"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                          placeholder="090-1234-5678"
                          className="h-9"
                          data-testid="input-shipping-phone"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                  {user ? (
                    <>
                      <Button
                        className="w-full bg-pink-500 hover:bg-pink-600"
                        disabled={userPoints < selectedProduct.price || purchaseMutation.isPending || (selectedProduct.productType === "physical" && (!shippingInfo.name || !shippingInfo.postalCode || !shippingInfo.address || !shippingInfo.phone))}
                        onClick={() => {
                          if (selectedProduct.productType === "physical") {
                            purchaseMutation.mutate({
                              productId: selectedProduct.id,
                              shipping: {
                                shippingName: shippingInfo.name,
                                shippingPostalCode: shippingInfo.postalCode,
                                shippingAddress: shippingInfo.address,
                                shippingPhone: shippingInfo.phone,
                              },
                            });
                          } else {
                            purchaseMutation.mutate({ productId: selectedProduct.id });
                          }
                        }}
                        data-testid="button-purchase"
                      >
                        {purchaseMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            購入中...
                          </>
                        ) : (
                          `${selectedProduct.price.toLocaleString()}pt で購入`
                        )}
                      </Button>
                      {userPoints < selectedProduct.price && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setProductDetailOpen(false);
                            setLocation("/points-purchase");
                          }}
                          data-testid="button-buy-points"
                        >
                          ポイントを購入する
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => setLocation("/auth")}
                      data-testid="button-login-to-purchase"
                    >
                      ログインして購入
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
