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
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { UserProfile, Video as VideoType, LiveStream, CreatorProfile } from "@shared/schema";
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
import { useState } from "react";

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
  { id: "v1", thumbnailUrl: img1, viewCount: 28500, title: "深夜の密会" },
  { id: "v2", thumbnailUrl: img2, viewCount: 15600, title: "バスタイム" },
  { id: "v3", thumbnailUrl: img3, viewCount: 9800, title: "シャワーの誘惑" },
  { id: "v4", thumbnailUrl: img4, viewCount: 5400, title: "ベッドルーム" },
  { id: "v5", thumbnailUrl: img2, viewCount: 3200, title: "秘密の時間" },
  { id: "v6", thumbnailUrl: img3, viewCount: 2100, title: "プライベート" },
];

export default function MyProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: creatorProfile } = useQuery<CreatorProfile | null>({
    queryKey: ["/api/creator-profiles", user?.id],
    enabled: !!user,
  });

  const { data: myVideos } = useQuery<VideoType[]>({
    queryKey: ["/api/my-videos"],
  });

  const { data: myLiveStreams } = useQuery<LiveStream[]>({
    queryKey: ["/api/my-live"],
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

  const displayName = creatorProfile?.displayName || profile?.displayName || user?.firstName || user?.email?.split("@")[0] || "ゲスト";
  const username = user?.email?.split("@")[0] || "user";
  const avatarUrl = profile?.avatarUrl || user?.profileImageUrl || demoAvatar;
  const bio = creatorProfile?.bio || profile?.bio || "Only-Uでプロフィールを編集してください";
  const websiteUrl = "https://only-u.fun";

  const [editName, setEditName] = useState(displayName);
  const [editBio, setEditBio] = useState(bio);
  const [editOpen, setEditOpen] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName: string; bio: string }) => {
      // Update both if applicable
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator-profiles", user?.id] });
      setEditOpen(false);
      toast({ title: "プロフィールを更新しました" });
    },
  });

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
          <Avatar className={`h-28 w-28 ring-4 ${isLive ? "ring-pink-500" : "ring-border/50"} shadow-xl overflow-hidden`}>
            <AvatarImage 
              src={avatarUrl} 
              className="object-cover w-full h-full"
            />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-3xl font-bold">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {isLive && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-pink-500 text-white text-[10px] font-bold shadow-lg ring-2 ring-background">
              LIVE
            </div>
          )}
        </div>

        {/* Username and Edit Button */}
        <div className="flex items-center gap-2 mt-4">
          <h1 className="text-lg font-bold flex items-center gap-1">
            {displayName}
            <BadgeCheck className="h-4 w-4 text-[#20D5EC] fill-[#20D5EC]" />
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
                <DialogTitle className="text-black">プロフィールを編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-black/70">名前</Label>
                  <Input 
                    id="name" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-black/5 border-black/10 focus:border-pink-500 text-black"
                  />
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
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => updateProfileMutation.mutate({ displayName: editName, bio: editBio })}
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
            <p className="text-xs text-muted-foreground">フォロー中</p>
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
          <div className="flex items-center justify-center gap-1 mt-1 text-sm">
            <LinkIcon className="h-3 w-3" />
            <a href={websiteUrl} className="text-muted-foreground hover:underline">
              {websiteUrl.replace("https://", "")}
            </a>
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
        </TabsList>
        
        <TabsContent value="videos" className="mt-0">
          <div className="grid grid-cols-3 gap-0.5">
            {displayVideos?.map((video) => (
              <div 
                key={video.id} 
                className="aspect-[9/16] relative bg-muted overflow-hidden group cursor-pointer"
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
                  <PlaySquare className="h-3 w-3" />
                  <span>{formatCount(video.viewCount || 0)}</span>
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
      </Tabs>
      
      <div className="h-24" />
    </motion.div>
  );
}
