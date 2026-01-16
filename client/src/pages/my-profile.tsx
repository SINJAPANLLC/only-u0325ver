import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft,
  Grid3X3, 
  PlaySquare, 
  Heart, 
  Link as LinkIcon,
  ShoppingBag,
  ChevronDown,
  BadgeCheck,
  Video,
  Edit2,
  Camera,
  Crown,
  Plus,
  Trash2,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { UserProfile, Video as VideoType, LiveStream, CreatorProfile, SubscriptionPlan } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

import demoAvatar from "@assets/generated_images/sexy_maid_7.jpg";
import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/nude_shower_4.jpg";
import img4 from "@assets/generated_images/lingerie_bed_3.jpg";

const demoProducts = [
  { id: "p1", name: "限定デジタル写真集 Vol.1", price: 3000, imageUrl: img1, productType: "digital" },
  { id: "p2", name: "サイン入りチェキ", price: 5000, imageUrl: img2, productType: "physical" },
  { id: "p3", name: "おやすみボイスメッセージ", price: 2000, imageUrl: img3, productType: "digital" },
  { id: "p4", name: "オリジナルTシャツ", price: 4500, imageUrl: img4, productType: "physical" },
];

const demoVideos = [
  { id: "v1", thumbnailUrl: img1, videoUrl: "https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4", viewCount: 28500, likeCount: 1250, title: "縦型動画" },
  { id: "v2", thumbnailUrl: img2, videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", viewCount: 15600, likeCount: 890, title: "横型動画" },
  { id: "v3", thumbnailUrl: img3, viewCount: 9800, likeCount: 456, title: "画像のみ" },
  { id: "v4", thumbnailUrl: img4, viewCount: 5400, likeCount: 234, title: "画像のみ2" },
  { id: "v5", thumbnailUrl: img2, viewCount: 3200, likeCount: 178, title: "画像のみ3" },
  { id: "v6", thumbnailUrl: img3, viewCount: 2100, likeCount: 98, title: "画像のみ4" },
];

export default function MyProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: profile, refetch: refetchProfile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: creatorProfile, refetch: refetchCreator } = useQuery<CreatorProfile | null>({
    queryKey: ["/api/creator-profiles", user?.id],
    enabled: !!user?.id,
  });

  const { data: myVideos } = useQuery<VideoType[]>({
    queryKey: ["/api/my-videos"],
  });

  const { data: myLiveStreams } = useQuery<LiveStream[]>({
    queryKey: ["/api/my-live"],
  });

  const { data: mySubscriptionPlans, refetch: refetchPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/my-subscription-plans"],
    enabled: !!creatorProfile,
  });

  const isLive = myLiveStreams?.some(stream => stream.status === "live") || false;

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleEditProfile = () => {
    setLocation("/account");
  };

  const displayName = profile?.displayName || creatorProfile?.displayName || user?.firstName || user?.email?.split("@")[0] || "ゲスト";
  const username = profile?.username || user?.email?.split("@")[0] || "user";
  const defaultAvatarUrl = profile?.avatarUrl || user?.profileImageUrl || demoAvatar;
  const bio = profile?.bio || creatorProfile?.bio || "Only-Uでプロフィールを編集してください";
  const websiteUrl = profile?.location || "";

  const [editName, setEditName] = useState(displayName);
  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(bio);
  const [editUrl, setEditUrl] = useState(websiteUrl);
  const [editAvatar, setEditAvatar] = useState(defaultAvatarUrl);
  const [currentAvatar, setCurrentAvatar] = useState(defaultAvatarUrl);
  const [editOpen, setEditOpen] = useState(false);
  
  // Subscription plan editing
  const [planEditOpen, setPlanEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("500");
  const [newPlanTier, setNewPlanTier] = useState("1");
  const [isNewPlan, setIsNewPlan] = useState(true);
  
  // Fullscreen video/image viewer
  const [selectedContent, setSelectedContent] = useState<{ id: string; thumbnailUrl: string; videoUrl?: string; title?: string } | null>(null);
  
  const createPlanMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; price: number; tier: number }) => {
      const res = await apiRequest("POST", "/api/subscription-plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription-plans"] });
      refetchPlans();
      setPlanEditOpen(false);
      toast({ title: "プランを作成しました" });
    },
    onError: (error: any) => {
      toast({ title: "エラー", description: error.message || "プランの作成に失敗しました", variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description: string; price: number; tier: number }) => {
      const res = await apiRequest("PATCH", `/api/subscription-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription-plans"] });
      refetchPlans();
      setPlanEditOpen(false);
      toast({ title: "プランを更新しました" });
    },
    onError: (error: any) => {
      toast({ title: "エラー", description: error.message || "プランの更新に失敗しました", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      await apiRequest("DELETE", `/api/subscription-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription-plans"] });
      refetchPlans();
      toast({ title: "プランを削除しました" });
    },
  });

  const handleOpenNewPlan = () => {
    setIsNewPlan(true);
    setEditingPlan(null);
    setNewPlanName("");
    setNewPlanDescription("");
    setNewPlanPrice("500");
    setNewPlanTier("1");
    setPlanEditOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setIsNewPlan(false);
    setEditingPlan(plan);
    setNewPlanName(plan.name);
    setNewPlanDescription(plan.description || "");
    setNewPlanPrice(plan.price.toString());
    setNewPlanTier(plan.tier.toString());
    setPlanEditOpen(true);
  };

  const handleSavePlan = () => {
    const price = parseInt(newPlanPrice) || 500;
    const tier = parseInt(newPlanTier) || 1;
    
    if (isNewPlan) {
      createPlanMutation.mutate({ name: newPlanName, description: newPlanDescription, price, tier });
    } else if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, name: newPlanName, description: newPlanDescription, price, tier });
    }
  };

  // Sync state when profile data loads OR editOpen changes
  useEffect(() => {
    if (editOpen) {
      setEditName(profile?.displayName || displayName);
      setEditUsername(profile?.username || username);
      setEditBio(profile?.bio || "");
      setEditUrl(profile?.location || "");
      setEditAvatar(profile?.avatarUrl || currentAvatar);
    }
  }, [editOpen, profile, currentAvatar, displayName, username]);
  
  // Update currentAvatar when profile data loads
  useEffect(() => {
    if (profile?.avatarUrl) {
      setCurrentAvatar(profile.avatarUrl);
    }
  }, [profile?.avatarUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; username?: string; bio: string; location?: string; avatarUrl?: string }) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      setCurrentAvatar(editAvatar);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-profiles", user?.id] });
      refetchProfile();
      refetchCreator();
      setEditOpen(false);
      toast({ title: "プロフィールを更新しました" });
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file, 400, 0.7);
        setEditAvatar(compressedImage);
      } catch (error) {
        console.error('Failed to compress image:', error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const followers = creatorProfile?.followerCount || 0;
  const following = creatorProfile?.followingCount || 0;
  const likes = 0; // Like count for creator is usually sum of all video likes

  const hasVideos = (myVideos && myVideos.length > 0) || (demoVideos && demoVideos.length > 0);
  const displayVideos = myVideos && myVideos.length > 0 ? myVideos : demoVideos;
  
  return (
    <motion.div 
      className="h-full bg-background overflow-y-auto scrollbar-hide"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center px-2 py-3 border-b border-border/50">
        <Button 
          size="icon" 
          variant="ghost"
          className="h-9 w-9"
          onClick={() => setLocation("/account")}
          data-testid="button-back"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center px-4 pt-6">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-28 w-28 ring-4 ring-pink-500 shadow-xl overflow-hidden">
            <AvatarImage 
              src={currentAvatar} 
              className="object-cover w-full h-full"
            />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-3xl font-bold">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Username and Edit Button */}
        <div className="flex items-center gap-2 mt-4">
          <h1 className="text-lg font-bold flex items-center gap-1">
            {displayName}
          </h1>
          
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs rounded-full flex items-center gap-1 bg-white/5 border-white/10 hover:bg-white/10"
                data-testid="button-edit-profile"
              >
                <Edit2 className="h-3 w-3" />
                編集
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[380px] rounded-2xl bg-white border-white/20 text-black">
              <DialogHeader>
                <DialogTitle>プロフィールを編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                    <Avatar className="h-24 w-24 ring-2 ring-pink-500 overflow-hidden">
                      <AvatarImage src={editAvatar} className="object-cover" />
                      <AvatarFallback>{editName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="text-white h-6 w-6" />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">タップして画像を変更</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-black/70 text-xs">名前</Label>
                  <Input 
                    id="name" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-black/5 border-black/10 focus:border-pink-500 text-black h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-black/70 text-xs">ユーザーネーム</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input 
                      id="username" 
                      value={editUsername} 
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="bg-black/5 border-black/10 focus:border-pink-500 text-black h-9 text-sm pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-black/70">自己紹介</Label>
                  <Textarea 
                    id="bio" 
                    value={editBio} 
                    onChange={(e) => setEditBio(e.target.value)}
                    className="bg-black/5 border-black/10 focus:border-pink-500 text-black min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-black/70">ウェブサイトURL</Label>
                  <Input 
                    id="url" 
                    value={editUrl} 
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="bg-black/5 border-black/10 focus:border-pink-500 text-black"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => {
                    const avatarChanged = editAvatar !== currentAvatar;
                    updateProfileMutation.mutate({ 
                      displayName: editName, 
                      username: editUsername,
                      bio: editBio, 
                      location: editUrl,
                      ...(avatarChanged && { avatarUrl: editAvatar })
                    });
                  }}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-full"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "保存中..." : "保存する"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Handle */}
        <p className="text-muted-foreground text-sm mt-1">@{username}</p>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-8 mt-5">
          <div className="text-center">
            <p className="text-lg font-bold">{formatCount(following)}</p>
            <p className="text-xs text-muted-foreground">フォロー</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{formatCount(followers)}</p>
            <p className="text-xs text-muted-foreground">フォロワー</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{formatCount(likes)}</p>
            <p className="text-xs text-muted-foreground">いいね</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="w-full mt-4 text-center">
          <p className="text-sm font-medium">{bio}</p>
          {websiteUrl && (
            <div className="flex items-center justify-center gap-1 mt-1 text-sm">
              <LinkIcon className="h-3 w-3" />
              <a href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">
                {websiteUrl.replace("https://", "").replace("http://", "")}
              </a>
            </div>
          )}
        </div>

        {/* Subscription Plans */}
        <div className="w-full mt-6 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">サブスクリプションプラン</h2>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 rounded-full text-[10px] px-3"
              onClick={() => {
                setIsNewPlan(true);
                setEditingPlan(null);
                setNewPlanName("");
                setNewPlanDescription("");
                setNewPlanPrice("500");
                setNewPlanTier("1");
                setPlanEditOpen(true);
              }}
              data-testid="button-add-plan"
            >
              <Plus className="h-3 w-3 mr-1" />
              追加
            </Button>
          </div>
          <div className="space-y-3">
            {mySubscriptionPlans && mySubscriptionPlans.length > 0 ? (
              mySubscriptionPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{plan.name}</span>
                    <span className="text-[10px] text-muted-foreground">{plan.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-pink-500 font-bold text-sm">{plan.price}pt / 月</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 rounded-full text-[10px] px-3"
                      onClick={() => {
                        setIsNewPlan(false);
                        setEditingPlan(plan);
                        setNewPlanName(plan.name);
                        setNewPlanDescription(plan.description || "");
                        setNewPlanPrice(plan.price.toString());
                        setNewPlanTier(plan.tier.toString());
                        setPlanEditOpen(true);
                      }}
                      data-testid={`button-edit-plan-${plan.id}`}
                    >
                      編集
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                プランがまだありません
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="videos" className="mt-2">
        <TabsList className="w-full bg-transparent border-b border-border/50 rounded-none h-12 justify-start px-2">
          <TabsTrigger 
            value="videos" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none h-full"
            data-testid="tab-videos"
          >
            <div className="flex items-center gap-1">
              <Grid3X3 className="h-5 w-5" />
              <ChevronDown className="h-3 w-3" />
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="shop" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none h-full"
            data-testid="tab-shop"
          >
            <ShoppingBag className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger 
            value="liked" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none h-full"
            data-testid="tab-liked"
          >
            <Heart className="h-5 w-5" />
          </TabsTrigger>
          {creatorProfile && (
            <TabsTrigger 
              value="plans" 
              className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none h-full"
              data-testid="tab-plans"
            >
              <Crown className="h-5 w-5" />
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="videos" className="mt-0">
          <div className="grid grid-cols-3 gap-0.5">
            {displayVideos?.map((video) => (
              <div 
                key={video.id} 
                className="aspect-[9/16] relative bg-muted overflow-hidden group cursor-pointer"
                onClick={() => setSelectedContent({ id: video.id, thumbnailUrl: video.thumbnailUrl || "", videoUrl: (video as any).videoUrl, title: video.title })}
                data-testid={`video-thumbnail-${video.id}`}
              >
                {video.thumbnailUrl ? (
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-[10px] font-bold drop-shadow-md">
                  <Heart className="h-3 w-3" />
                  <span>{formatCount(video.likeCount || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="shop" className="mt-0">
          <div className="grid grid-cols-2 gap-4 p-4">
            {demoProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm group cursor-pointer"
                onClick={() => setLocation("/shop")}
              >
                <div className="aspect-square relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                      {product.productType === "digital" ? "デジタル" : "物販"}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold truncate">{product.name}</h3>
                  <p className="text-pink-500 font-bold mt-1">{product.price.toLocaleString()}pt</p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>


        <TabsContent value="liked" className="mt-0">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Heart className="h-10 w-10 mb-2 opacity-50" />
            <p>いいねした動画はここに表示されます</p>
          </div>
        </TabsContent>

        {creatorProfile && (
          <TabsContent value="plans" className="mt-0 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">サブスクリプションプラン</h3>
                <Button size="sm" onClick={handleOpenNewPlan} data-testid="button-add-plan">
                  <Plus className="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
              
              {mySubscriptionPlans && mySubscriptionPlans.length > 0 ? (
                <div className="space-y-3">
                  {mySubscriptionPlans.map((plan) => (
                    <div 
                      key={plan.id} 
                      className="bg-card border border-border rounded-lg p-4"
                      data-testid={`plan-card-${plan.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                          <p className="text-pink-500 font-bold mt-2 text-lg">{plan.price.toLocaleString()}pt/月</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEditPlan(plan)}
                            data-testid={`button-edit-plan-${plan.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deletePlanMutation.mutate(plan.id)}
                            disabled={deletePlanMutation.isPending}
                            data-testid={`button-delete-plan-${plan.id}`}
                          >
                            {deletePlanMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground bg-muted/50 rounded-lg">
                  <Crown className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">プランを作成してファンからの収益を得ましょう</p>
                </div>
              )}
            </div>

          </TabsContent>
        )}
      </Tabs>

      <Dialog open={planEditOpen} onOpenChange={setPlanEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNewPlan ? "新しいプランを作成" : "プランを編集"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">プラン名</Label>
              <Input
                id="plan-name"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="例: ベーシックプラン"
                data-testid="input-plan-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">説明</Label>
              <Textarea
                id="plan-description"
                value={newPlanDescription}
                onChange={(e) => setNewPlanDescription(e.target.value)}
                placeholder="プランの特典を説明してください"
                data-testid="input-plan-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-price">料金（ポイント/月）</Label>
              <Input
                id="plan-price"
                type="number"
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(e.target.value)}
                min="100"
                step="100"
                data-testid="input-plan-price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanEditOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handleSavePlan}
              disabled={!newPlanName || createPlanMutation.isPending || updatePlanMutation.isPending}
              className="bg-pink-500 hover:bg-pink-600"
              data-testid="button-save-plan"
            >
              {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {isNewPlan ? "作成" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen content viewer */}
      {selectedContent && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 100000,
          }}>
            <button
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedContent(null)}
              data-testid="button-close-content"
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>
          <div 
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {selectedContent.videoUrl ? (
              <video
                src={selectedContent.videoUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                controls
                autoPlay
                playsInline
                data-testid="fullscreen-video"
              />
            ) : (
              <img
                src={selectedContent.thumbnailUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                data-testid="fullscreen-image"
              />
            )}
          </div>
        </div>,
        document.body
      )}
      
      <div className="h-24" />
    </motion.div>
  );
}
