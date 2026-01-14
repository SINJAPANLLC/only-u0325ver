import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Share2, 
  Grid3X3, 
  PlaySquare, 
  Bookmark, 
  Heart, 
  Menu,
  Plus,
  Phone,
  MapPin,
  Link as LinkIcon,
  ShoppingBag,
  Repeat2,
  ChevronDown,
  BadgeCheck,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { UserProfile, Video as VideoType } from "@shared/schema";

import demoAvatar from "@assets/generated_images/sexy_maid_7.jpg";
import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/nude_shower_4.jpg";
import img4 from "@assets/generated_images/lingerie_bed_3.jpg";

const demoVideos = [
  { id: "v1", thumbnail: img1, views: 28500 },
  { id: "v2", thumbnail: img2, views: 15600 },
  { id: "v3", thumbnail: img3, views: 9800 },
  { id: "v4", thumbnail: img4, views: 5400 },
  { id: "v5", thumbnail: img2, views: 3200 },
  { id: "v6", thumbnail: img3, views: 2100 },
];

export default function MyProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: myVideos } = useQuery<VideoType[]>({
    queryKey: ["/api/my-videos"],
  });

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleEditProfile = () => {
    setLocation("/account");
  };

  const displayName = profile?.displayName || user?.firstName || user?.email?.split("@")[0] || "ゲスト";
  const username = user?.email?.split("@")[0] || "user";
  const avatarUrl = profile?.avatarUrl || user?.profileImageUrl || demoAvatar;
  const bio = profile?.bio || "Only-Uでプロフィールを編集してください";
  const websiteUrl = "https://only-u.fun";

  const followers = 0;
  const following = 0;
  const likes = 0;

  const hasVideos = myVideos && myVideos.length > 0;
  const displayVideos = hasVideos ? myVideos : demoVideos;
  
  return (
    <motion.div 
      className="h-full bg-background overflow-y-auto scrollbar-hide"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost"
            className="h-9 w-9"
            data-testid="button-add-friend"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost"
            className="h-9 w-9"
            data-testid="button-share"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setLocation("/account")}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center px-4 pt-6">
        {/* Avatar with Add button */}
        <div className="relative">
          <Avatar className="h-24 w-24 ring-2 ring-border">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-2xl font-bold">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <button 
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#25F4EE] flex items-center justify-center shadow-md"
            data-testid="button-add-content"
          >
            <Plus className="h-4 w-4 text-black" />
          </button>
        </div>

        {/* Username and Edit Button */}
        <div className="flex items-center gap-2 mt-4">
          <h1 className="text-lg font-bold flex items-center gap-1">
            {displayName}
            <BadgeCheck className="h-4 w-4 text-[#20D5EC] fill-[#20D5EC]" />
          </h1>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs rounded-md"
            onClick={handleEditProfile}
            data-testid="button-edit-profile"
          >
            編集
          </Button>
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

        {/* Contact Buttons */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <button 
            className="flex items-center gap-1 text-sm text-[#FE2C55]"
            data-testid="button-phone"
          >
            <Phone className="h-4 w-4" />
            <span>電話番号</span>
          </button>
          <button 
            className="flex items-center gap-1 text-sm text-[#FE2C55]"
            data-testid="button-address"
          >
            <MapPin className="h-4 w-4" />
            <span>住所</span>
          </button>
        </div>

        {/* Feature Buttons */}
        <div className="flex items-center justify-center gap-4 mt-4 pb-4 border-b border-border/50 w-full">
          <button 
            className="flex items-center gap-1.5 text-sm"
            data-testid="button-studio"
          >
            <Video className="h-4 w-4 text-[#FE2C55]" />
            <span>Only-U Studio</span>
          </button>
          <button 
            className="flex items-center gap-1.5 text-sm"
            data-testid="button-orders"
          >
            <ShoppingBag className="h-4 w-4 text-[#25F4EE]" />
            <span>自分の注文</span>
          </button>
          <button 
            className="flex items-center gap-1.5 text-sm"
            data-testid="button-subscription"
          >
            <Heart className="h-4 w-4 text-[#FE2C55]" />
            <span>サブスク</span>
          </button>
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
            value="reposts" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none h-full"
            data-testid="tab-reposts"
          >
            <Repeat2 className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger 
            value="saved" 
            className="flex-1 data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none h-full"
            data-testid="tab-saved"
          >
            <Bookmark className="h-5 w-5" />
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
          {hasVideos ? (
            <div className="grid grid-cols-3 gap-0.5">
              {myVideos.map((video) => (
                <div 
                  key={video.id} 
                  className="aspect-[9/16] relative bg-muted"
                  data-testid={`video-thumbnail-${video.id}`}
                >
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs drop-shadow-md">
                    <PlaySquare className="h-3 w-3" />
                    <span>{formatCount(video.viewCount || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Video className="h-10 w-10 mb-2 opacity-50" />
              <p>まだ投稿がありません</p>
              <p className="text-xs mt-1">クリエイター登録して動画を投稿しよう</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shop" className="mt-0">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mb-2 opacity-50" />
            <p>商品はまだありません</p>
          </div>
        </TabsContent>

        <TabsContent value="reposts" className="mt-0">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Repeat2 className="h-10 w-10 mb-2 opacity-50" />
            <p>リポストした動画はここに表示されます</p>
          </div>
        </TabsContent>
        
        <TabsContent value="saved" className="mt-0">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Bookmark className="h-10 w-10 mb-2 opacity-50" />
            <p>保存した動画はここに表示されます</p>
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
