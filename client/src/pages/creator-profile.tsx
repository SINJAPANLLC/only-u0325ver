import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MoreHorizontal, Share2, Grid3X3, PlaySquare, Bookmark, Heart, MessageCircle, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/nude_shower_4.jpg";
import img4 from "@assets/generated_images/lingerie_bed_3.jpg";

const creatorData: Record<string, {
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

const defaultCreator = {
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

export default function CreatorProfile() {
  const [, params] = useRoute("/creator/:username");
  const [, setLocation] = useLocation();
  const [isFollowing, setIsFollowing] = useState(false);
  
  const username = params?.username || "Risa";
  const creator = creatorData[username] || defaultCreator;
  
  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  const handleBack = () => {
    setLocation("/");
  };
  
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
              onClick={() => setIsFollowing(!isFollowing)}
              data-testid="button-follow-toggle"
            >
              {isFollowing ? (
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
            <Button variant="outline" className="flex-1" data-testid="button-message">
              <MessageCircle className="h-4 w-4 mr-2" />
              メッセージ
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
