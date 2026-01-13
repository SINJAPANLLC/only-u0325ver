import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowLeft, MoreHorizontal, Settings, Grid3X3, Heart, Bookmark, 
  PlaySquare, Edit, Camera, Send, Clock, CheckCircle, XCircle,
  LogOut, CreditCard, Bell, Shield, HelpCircle, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UserProfile, CreatorApplication } from "@shared/schema";

import demoAvatar from "@assets/generated_images/sexy_maid_7.jpg";
import demoCover from "@assets/generated_images/nude_bedroom_1.jpg";

export default function Account() {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    location: "",
    avatarUrl: "",
    coverImageUrl: "",
  });

  const [applicationForm, setApplicationForm] = useState({
    portfolioUrl: "",
    experience: "",
    reason: "",
  });

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: creatorApplication } = useQuery<CreatorApplication | null>({
    queryKey: ["/api/creator-applications/me"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const response = await apiRequest("PUT", "/api/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsEditDialogOpen(false);
      toast({ title: "プロフィールを更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data: typeof applicationForm) => {
      const response = await apiRequest("POST", "/api/creator-applications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator-applications/me"] });
      setIsApplicationDialogOpen(false);
      toast({ title: "申請を送信しました" });
    },
    onError: () => {
      toast({ title: "申請に失敗しました", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isApprovedCreator = creatorApplication?.status === "approved";
  const isPendingApplication = creatorApplication?.status === "pending";
  const isRejectedApplication = creatorApplication?.status === "rejected";

  const displayName = profile?.displayName || user?.firstName || user?.email?.split("@")[0] || "ユーザー";
  const username = user?.email?.split("@")[0] || "user";
  const avatarUrl = profile?.avatarUrl || user?.profileImageUrl || demoAvatar;
  const coverUrl = profile?.coverImageUrl || demoCover;
  const bio = profile?.bio || "Only-Uへようこそ！\nプロフィールを編集してあなたについて教えてください✨";

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleBack = () => {
    setLocation("/");
  };

  const openEditDialog = () => {
    setProfileForm({
      displayName: profile?.displayName || user?.firstName || "",
      bio: profile?.bio || "",
      location: profile?.location || "",
      avatarUrl: profile?.avatarUrl || "",
      coverImageUrl: profile?.coverImageUrl || "",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <motion.div 
      className="h-full bg-background overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative">
        <div className="h-44 relative">
          <img 
            src={coverUrl} 
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
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>設定</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-payment">
                    <CreditCard className="h-4 w-4 mr-3" />
                    支払い方法
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-notifications">
                    <Bell className="h-4 w-4 mr-3" />
                    通知設定
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-language">
                    <Globe className="h-4 w-4 mr-3" />
                    言語設定
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-privacy">
                    <Shield className="h-4 w-4 mr-3" />
                    プライバシー
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" data-testid="button-help">
                    <HelpCircle className="h-4 w-4 mr-3" />
                    ヘルプ
                  </Button>
                  <Separator className="my-4" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive"
                    onClick={() => logout()}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    ログアウト
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <div className="relative px-4 -mt-12">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-2xl font-bold">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{displayName}</h1>
                {isApprovedCreator && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 text-xs font-medium">
                    認証済み
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">@{username}</p>
            </div>
          </div>
          
          <p className="mt-4 text-sm whitespace-pre-line">{bio}</p>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="font-bold">{formatCount(0)}</p>
              <p className="text-xs text-muted-foreground">フォロワー</p>
            </div>
            <div className="text-center">
              <p className="font-bold">0</p>
              <p className="text-xs text-muted-foreground">フォロー中</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{formatCount(0)}</p>
              <p className="text-xs text-muted-foreground">いいね</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1"
              variant="outline"
              onClick={openEditDialog}
              data-testid="button-edit-profile"
            >
              <Edit className="h-4 w-4 mr-2" />
              プロフィール編集
            </Button>
          </div>

          {!isApprovedCreator && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-5 w-5 text-pink-500" />
                <span className="font-medium">クリエイターモード</span>
              </div>
              
              {isPendingApplication ? (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  審査中 - 承認をお待ちください
                </div>
              ) : isRejectedApplication ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    申請が却下されました
                  </div>
                  <Button 
                    size="sm"
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
                    onClick={() => setIsApplicationDialogOpen(true)}
                    data-testid="button-reapply-creator"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    再申請する
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    クリエイターとして活動するには申請が必要です
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
                    onClick={() => setIsApplicationDialogOpen(true)}
                    data-testid="button-apply-creator"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    クリエイター申請する
                  </Button>
                </>
              )}
            </div>
          )}

          {isApprovedCreator && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">クリエイター認証済み</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                動画投稿やライブ配信が利用できます
              </p>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="w-full bg-transparent border-b rounded-none">
            <TabsTrigger 
              value="posts" 
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
          
          <TabsContent value="posts" className="mt-0">
            {isApprovedCreator ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>まだ投稿がありません</p>
                <Button className="mt-3" size="sm" data-testid="button-create-post">
                  最初の投稿を作成
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-center px-4">
                クリエイター申請が承認されると<br />投稿できるようになります
              </div>
            )}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>プロフィール編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                value={profileForm.displayName}
                onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                placeholder="表示名を入力"
                data-testid="input-display-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="自己紹介を入力"
                rows={3}
                data-testid="input-bio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">アバター画像URL</Label>
              <Input
                id="avatarUrl"
                value={profileForm.avatarUrl}
                onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-avatar-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">カバー画像URL</Label>
              <Input
                id="coverImageUrl"
                value={profileForm.coverImageUrl}
                onChange={(e) => setProfileForm({ ...profileForm, coverImageUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-cover-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">場所</Label>
              <Input
                id="location"
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                placeholder="例: 東京"
                data-testid="input-location"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => updateProfileMutation.mutate(profileForm)}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>クリエイター申請</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              申請内容を審査後、承認されるとクリエイター機能が使えるようになります。
            </p>
            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">ポートフォリオURL（任意）</Label>
              <Input
                id="portfolioUrl"
                value={applicationForm.portfolioUrl}
                onChange={(e) => setApplicationForm({ ...applicationForm, portfolioUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-portfolio-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">活動経験</Label>
              <Textarea
                id="experience"
                value={applicationForm.experience}
                onChange={(e) => setApplicationForm({ ...applicationForm, experience: e.target.value })}
                placeholder="これまでの配信・クリエイター活動について"
                rows={3}
                data-testid="input-experience"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">申請理由</Label>
              <Textarea
                id="reason"
                value={applicationForm.reason}
                onChange={(e) => setApplicationForm({ ...applicationForm, reason: e.target.value })}
                placeholder="Only-Uでどのような活動をしたいですか？"
                rows={3}
                data-testid="input-reason"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => submitApplicationMutation.mutate(applicationForm)}
              disabled={submitApplicationMutation.isPending}
              data-testid="button-submit-application"
            >
              {submitApplicationMutation.isPending ? "送信中..." : "申請を送信"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
