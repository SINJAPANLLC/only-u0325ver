import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Grid3X3, PlaySquare, Bookmark, Heart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { UserProfile } from "@shared/schema";

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
];

export default function MyProfile() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  const handleBack = () => {
    setLocation("/account");
  };

  const handleSettings = () => {
    setLocation("/account");
  };

  const displayName = profile?.displayName || user?.firstName || user?.email?.split("@")[0] || "ゲスト";
  const username = user?.email?.split("@")[0] || "user";
  const avatarUrl = profile?.avatarUrl || user?.profileImageUrl || demoAvatar;
  const bio = profile?.bio || "Only-Uでプロフィールを編集してください✨";

  const followers = 125000;
  const following = 48;
  const likes = 2850000;
  
  return (
    <motion.div 
      className="h-full bg-background overflow-y-auto"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      <div className="relative">
        <div className="h-44 relative">
          <img 
            src={img1} 
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
                onClick={handleSettings}
                data-testid="button-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="relative px-4 -mt-12">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-2xl font-bold">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{displayName}</h1>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 text-xs font-medium">
                  認証済み
                </span>
              </div>
              <p className="text-muted-foreground text-sm">@{username}</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm whitespace-pre-line">{bio}</p>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-bold">{formatCount(followers)}</p>
              <p className="text-xs text-muted-foreground">フォロワー</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{following}</p>
              <p className="text-xs text-muted-foreground">フォロー中</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{formatCount(likes)}</p>
              <p className="text-xs text-muted-foreground">いいね</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
              onClick={handleSettings}
              data-testid="button-edit-profile"
            >
              プロフィール編集
            </Button>
            <Button variant="outline" className="flex-1" data-testid="button-share-profile">
              <Share2 className="h-4 w-4 mr-2" />
              シェア
            </Button>
          </div>
        </div>
        
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
              {demoVideos.map((video) => (
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
