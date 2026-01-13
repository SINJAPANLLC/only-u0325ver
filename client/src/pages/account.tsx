import { motion } from "framer-motion";
import { 
  User, Settings, CreditCard, ShoppingBag, Heart, Bell, 
  HelpCircle, FileText, Shield, LogOut, ChevronRight,
  Radio, Package, BarChart3, Wallet, Star, Globe, Send, Clock, CheckCircle, XCircle, Edit, Eye
} from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UserProfile, CreatorApplication } from "@shared/schema";

import demoAvatar from "@assets/generated_images/sexy_maid_7.jpg";

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  badge?: string;
  onClick?: () => void;
  href?: string;
}

function MenuItem({ icon: Icon, label, description, badge, onClick, href }: MenuItemProps) {
  const content = (
    <div 
      className="flex items-center gap-4 p-4 rounded-xl hover-elevate cursor-pointer"
      onClick={onClick}
    >
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {badge && (
            <Badge variant="secondary" className="text-xs">{badge}</Badge>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}

export default function Account() {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    location: "",
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
      setIsProfileDialogOpen(false);
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
      <div className="pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isApprovedCreator = creatorApplication?.status === "approved";
  const isPendingApplication = creatorApplication?.status === "pending";
  const isRejectedApplication = creatorApplication?.status === "rejected";

  const userMenuItems: MenuItemProps[] = [
    { icon: Eye, label: "プロフィールを確認", description: "自分のプロフィールを見る", onClick: () => setLocation("/my-profile") },
    { icon: Heart, label: "フォロー中", description: "12人のクリエイター" },
    { icon: Star, label: "加入中プラン", description: "3つのサブスクリプション" },
    { icon: ShoppingBag, label: "購入履歴", description: "過去の購入を確認" },
    { icon: CreditCard, label: "支払い方法", description: "カードを管理" },
  ];

  const creatorMenuItems: MenuItemProps[] = [
    { icon: Radio, label: "ライブ配信", description: "配信を開始する" },
    { icon: Package, label: "コンテンツ管理", description: "動画・商品を管理" },
    { icon: BarChart3, label: "売り上げ管理", description: "収益を確認" },
    { icon: Wallet, label: "振込申請", description: "口座登録・出金" },
  ];

  const settingsMenuItems: MenuItemProps[] = [
    { icon: User, label: "個人情報", description: "プロフィールを編集" },
    { icon: Bell, label: "通知設定", description: "通知をカスタマイズ" },
    { icon: Globe, label: "言語設定", description: "日本語", badge: "JA" },
    { icon: Shield, label: "プライバシー", description: "ブロックユーザーなど" },
  ];

  const legalMenuItems: MenuItemProps[] = [
    { icon: FileText, label: "利用規約", href: "/terms" },
    { icon: Shield, label: "プライバシーポリシー", href: "/privacy" },
    { icon: FileText, label: "特定商取引法に基づく表記", href: "/legal" },
    { icon: HelpCircle, label: "ヘルプ・お問い合わせ" },
  ];

  const displayName = profile?.displayName || user?.firstName || user?.email?.split("@")[0] || "ゲスト";

  return (
    <div className="pb-20 overflow-y-auto scrollbar-hide">
      <div className="h-16" />
      <div className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-6"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={profile?.avatarUrl || user?.profileImageUrl || demoAvatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{displayName}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {profile?.bio && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{profile.bio}</p>
              )}
            </div>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  data-testid="button-edit-profile"
                  onClick={() => {
                    setProfileForm({
                      displayName: profile?.displayName || user?.firstName || "",
                      bio: profile?.bio || "",
                      location: profile?.location || "",
                    });
                    setIsProfileDialogOpen(true);
                  }}
                >
                  <Edit className="h-5 w-5" />
                </Button>
              </DialogTrigger>
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
          </div>

          <Separator className="my-4 bg-border/50" />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">クリエイターモード</p>
                {isApprovedCreator ? (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    承認済み - 配信・販売が可能です
                  </div>
                ) : isPendingApplication ? (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Clock className="h-3 w-3" />
                    審査中 - 承認をお待ちください
                  </div>
                ) : isRejectedApplication ? (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3 w-3" />
                    申請が却下されました
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    クリエイターとして活動するには申請が必要です
                  </p>
                )}
              </div>
            </div>

            {!isApprovedCreator && !isPendingApplication && (
              <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
                    data-testid="button-apply-creator"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    クリエイター申請する
                  </Button>
                </DialogTrigger>
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
            )}
          </div>
        </motion.div>

        {isApprovedCreator && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">クリエイター</h3>
            <div className="rounded-2xl bg-card border border-card-border overflow-hidden">
              {creatorMenuItems.map((item, index) => (
                <div key={item.label}>
                  <MenuItem {...item} />
                  {index < creatorMenuItems.length - 1 && (
                    <Separator className="mx-4" />
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">アカウント</h3>
          <div className="rounded-2xl bg-card border border-card-border overflow-hidden">
            {userMenuItems.map((item, index) => (
              <div key={item.label}>
                <MenuItem {...item} />
                {index < userMenuItems.length - 1 && (
                  <Separator className="mx-4" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">設定</h3>
          <div className="rounded-2xl bg-card border border-card-border overflow-hidden">
            {settingsMenuItems.map((item, index) => (
              <div key={item.label}>
                <MenuItem {...item} />
                {index < settingsMenuItems.length - 1 && (
                  <Separator className="mx-4" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">法的情報</h3>
          <div className="rounded-2xl bg-card border border-card-border overflow-hidden">
            {legalMenuItems.map((item, index) => (
              <div key={item.label}>
                <MenuItem {...item} />
                {index < legalMenuItems.length - 1 && (
                  <Separator className="mx-4" />
                )}
              </div>
            ))}
          </div>
        </section>

        <Button 
          variant="outline" 
          className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5 mr-2" />
          ログアウト
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Only-U v1.0.0<br />
          運営: 合同会社SIN JAPAN KANAGAWA
        </p>
      </div>
    </div>
  );
}
