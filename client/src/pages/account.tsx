import { motion } from "framer-motion";
import { 
  User, Settings, CreditCard, ShoppingBag, Heart, Bell, 
  HelpCircle, FileText, Shield, LogOut, ChevronRight,
  Radio, Package, BarChart3, Wallet, Star, Globe, Send, Clock, CheckCircle, XCircle, Edit, Phone, Mail, Crown, Loader2, Trash2
} from "lucide-react";
import { useLocation, Link } from "wouter";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UserProfile, CreatorApplication, Subscription } from "@shared/schema";

import logoImage from "@assets/IMG_9769_1768973936225.PNG";

interface SubscriptionWithDetails extends Subscription {
  creatorDisplayName: string | null;
  creatorAvatarUrl: string | null;
  planName: string | null;
  planPrice: number | null;
}

interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  badge?: string;
  badgeVariant?: "pink" | "default";
  onClick?: () => void;
  href?: string;
}

function MenuItem({ icon: Icon, label, description, badge, badgeVariant = "default", onClick, href }: MenuItemProps) {
  const content = (
    <div
      className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer group active:bg-white/10 hover:bg-white/5 transition-colors"
      onClick={onClick}
    >
      <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/20 transition-colors">
        <Icon className="h-4.5 w-4.5 text-white/60 group-hover:text-pink-400 transition-colors" style={{ height: "18px", width: "18px" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white">{label}</span>
          {badge && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              badgeVariant === "pink"
                ? "bg-pink-500/20 text-pink-400"
                : "bg-white/10 text-white/50"
            }`}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-white/40 mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/10">
        {children}
      </div>
    </section>
  );
}

export default function Account() {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isSubscriptionsDialogOpen, setIsSubscriptionsDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<SubscriptionWithDetails | null>(null);
  
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

  const { data: userSubscriptions, isLoading: isLoadingSubscriptions } = useQuery<SubscriptionWithDetails[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      await apiRequest("DELETE", `/api/subscription/${creatorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      setSubscriptionToCancel(null);
      toast({ title: "サブスクリプションを解約しました" });
    },
    onError: () => {
      toast({ title: "解約に失敗しました", variant: "destructive" });
    },
  });

  const toggleAutoRenewMutation = useMutation({
    mutationFn: async ({ creatorId, planId }: { creatorId: string; planId: string }) => {
      await apiRequest("DELETE", `/api/subscription/${creatorId}/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({ title: "自動更新を停止しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
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
      <div className="flex items-center justify-center min-h-[60vh] bg-black">
        <div className="animate-spin h-8 w-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isApprovedCreator = creatorApplication?.status === "approved";
  const isPendingApplication = creatorApplication?.status === "pending";
  const isRejectedApplication = creatorApplication?.status === "rejected";

  const userMenuItems: MenuItemProps[] = [
    { icon: User, label: "プロフィール", description: "自分のプロフィールを見る", onClick: () => setLocation("/my-profile") },
    { 
      icon: Star, 
      label: "加入中のプラン", 
      description: "サブスクリプション管理",
      badge: userSubscriptions && userSubscriptions.length > 0 ? `${userSubscriptions.length}件` : undefined,
      onClick: () => setIsSubscriptionsDialogOpen(true),
    },
    { icon: CreditCard, label: "お支払い方法", description: "カードを管理", href: "/payment-methods" },
    { icon: ShoppingBag, label: "購入履歴", description: "過去の購入を確認", href: "/my-purchases" },
  ];

  const creatorMenuItems: MenuItemProps[] = [
    { icon: Radio, label: "ライブ配信", description: "配信を開始する", href: "/creator-live" },
    { icon: Package, label: "コンテンツ管理", description: "動画・商品を管理", href: "/creator-content" },
    { icon: ShoppingBag, label: "ショップ管理", description: "商品を管理", href: "/creator-shop" },
    { icon: Package, label: "注文管理", description: "物販注文を管理", href: "/creator-orders" },
    { icon: BarChart3, label: "売上管理", description: "収益を確認", href: "/creator-sales" },
    { icon: Wallet, label: "振込申請", description: "口座登録・出金", href: "/creator-withdrawal" },
  ];

  const settingsMenuItems: MenuItemProps[] = [
    { icon: User, label: "本人情報", description: "本人確認情報を編集", href: "/personal-info" },
    { icon: Phone, label: "電話番号認証", description: "電話番号を登録", href: "/phone-verification" },
    { icon: Mail, label: "メールアドレス認証", description: "メールアドレスを確認", href: "/email-verification" },
    { icon: Globe, label: "言語設定", description: "日本語", badge: "JA", href: "/language-settings" },
    { icon: Bell, label: "通知設定", description: "通知をカスタマイズ", href: "/notification-settings" },
    { icon: Shield, label: "プライバシー設定", description: "ブロックユーザーなど", href: "/privacy-settings" },
  ];

  const legalMenuItems: MenuItemProps[] = [
    { icon: FileText, label: "利用規約", href: "/terms" },
    { icon: Shield, label: "プライバシーポリシー", href: "/privacy" },
    { icon: FileText, label: "特定商取引法に基づく表記", href: "/legal" },
    { icon: FileText, label: "掲載ガイドライン", href: "/guidelines" },
    { icon: HelpCircle, label: "ヘルプ・お問い合わせ", href: "/help" },
  ];

  const displayName = profile?.displayName || user?.firstName || user?.email?.split("@")[0] || "ゲスト";

  return (
    <div className="bg-black text-white pb-24">
      {/* Logo header */}
      <div className="flex items-center px-4 h-16">
        <img src={logoImage} alt="Only-U" className="h-16 object-contain brightness-0 invert" />
      </div>

      {/* Profile Hero — no background image */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Avatar className={`h-20 w-20 shadow-lg ${isApprovedCreator ? 'ring-2 ring-pink-500' : ''}`}>
              <AvatarImage src={profile?.avatarUrl || user?.profileImageUrl || logoImage} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-2xl font-bold">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isApprovedCreator && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-pink-500 border-2 border-black flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          <Link href="/points-purchase">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-500/30 cursor-pointer hover:bg-pink-500/20 transition-colors" data-testid="link-points-purchase">
              <span className="text-sm font-bold text-pink-400" data-testid="text-user-points">{(profile?.points ?? 0).toLocaleString()}</span>
              <span className="text-xs text-pink-400">pt</span>
            </div>
          </Link>
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            {isApprovedCreator && (
              <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 text-xs">クリエイター</Badge>
            )}
          </div>
          {profile?.bio && (
            <p className="text-sm text-white/50 mt-1 line-clamp-2">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Creator Mode Card */}
      {!isApprovedCreator && (
        <div className="px-4 mb-5">
          <div className={`rounded-2xl p-4 border ${
            isPendingApplication
              ? "bg-amber-500/10 border-amber-500/30"
              : isRejectedApplication
              ? "bg-red-500/10 border-red-500/30"
              : "bg-pink-500/10 border-pink-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  isPendingApplication ? "bg-amber-500/20"
                  : isRejectedApplication ? "bg-red-500/20"
                  : "bg-pink-500/20"
                }`}>
                  <Radio className={`h-5 w-5 ${
                    isPendingApplication ? "text-amber-400"
                    : isRejectedApplication ? "text-red-400"
                    : "text-pink-400"
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">クリエイターモード</p>
                  {isPendingApplication ? (
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Clock className="h-3 w-3" />
                      審査中 - 承認をお待ちください
                    </div>
                  ) : isRejectedApplication ? (
                    <div className="flex items-center gap-1 text-xs text-red-400">
                      <XCircle className="h-3 w-3" />
                      申請が却下されました
                    </div>
                  ) : (
                    <p className="text-xs text-white/50">配信・販売を始めよう</p>
                  )}
                </div>
              </div>
              <Link href="/creator-application">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 rounded-xl text-xs"
                  data-testid="button-apply-creator"
                >
                  {isPendingApplication ? "確認する" : isRejectedApplication ? "再申請" : "申請する"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-5">
        {/* Creator Menu */}
        {isApprovedCreator && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MenuSection title="クリエイター">
              {creatorMenuItems.map((item) => (
                <MenuItem key={item.label} {...item} />
              ))}
            </MenuSection>
          </motion.div>
        )}

        {/* User Menu */}
        <MenuSection title="アカウント">
          {userMenuItems.map((item) => (
            <MenuItem key={item.label} {...item} />
          ))}
        </MenuSection>

        {/* Settings */}
        <MenuSection title="設定">
          {settingsMenuItems.map((item) => (
            <MenuItem key={item.label} {...item} />
          ))}
        </MenuSection>

        {/* Legal */}
        <MenuSection title="法的情報">
          {legalMenuItems.map((item) => (
            <MenuItem key={item.label} {...item} />
          ))}
        </MenuSection>

        {/* Logout */}
        <button
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
          onClick={() => { window.location.href = "/api/logout"; }}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>
      </div>

      {/* Subscriptions Dialog */}
      <Dialog open={isSubscriptionsDialogOpen} onOpenChange={setIsSubscriptionsDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>加入中のプラン</DialogTitle>
            <DialogDescription>現在加入中のサブスクリプションを管理できます</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isLoadingSubscriptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userSubscriptions && userSubscriptions.length > 0 ? (
              userSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="p-4 rounded-xl bg-muted space-y-3"
                  data-testid={`subscription-item-${subscription.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/creator/${subscription.creatorId}`}
                      onClick={() => setIsSubscriptionsDialogOpen(false)}
                      data-testid={`link-creator-profile-${subscription.id}`}
                    >
                      <Avatar className="h-12 w-12 border-2 border-pink-500 cursor-pointer">
                        <AvatarImage src={subscription.creatorAvatarUrl || logoImage} alt={subscription.creatorDisplayName || "Creator"} />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
                          <Crown className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/creator/${subscription.creatorId}`}
                        onClick={() => setIsSubscriptionsDialogOpen(false)}
                        className="hover:underline"
                        data-testid={`link-creator-name-${subscription.id}`}
                      >
                        <p className="font-medium truncate">
                          {subscription.creatorDisplayName || `@${subscription.creatorId.slice(0, 8)}...`}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary" className="bg-pink-500 text-white text-xs">
                          {subscription.planName || `Tier ${subscription.tier}`}
                        </Badge>
                        <span className="text-pink-500 font-medium">
                          {subscription.planPrice ? `${subscription.planPrice.toLocaleString()}pt/月` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="space-y-1">
                      <p>
                        有効期限: {subscription.expiresAt
                          ? new Date(subscription.expiresAt).toLocaleDateString("ja-JP")
                          : "アクティブ"
                        }
                      </p>
                      {subscription.autoRenew ? (
                        <p className="text-green-600 dark:text-green-400">自動更新: ON</p>
                      ) : (
                        <p className="text-orange-500">自動更新停止中</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {subscription.autoRenew && subscription.planId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAutoRenewMutation.mutate({
                            creatorId: subscription.creatorId,
                            planId: subscription.planId!,
                          })}
                          disabled={toggleAutoRenewMutation.isPending}
                          data-testid={`button-stop-auto-renew-${subscription.id}`}
                        >
                          {toggleAutoRenewMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "自動更新停止"
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        data-testid={`button-view-creator-${subscription.id}`}
                      >
                        <Link
                          href={`/creator/${subscription.creatorId}`}
                          onClick={() => setIsSubscriptionsDialogOpen(false)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Crown className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">加入中のプランはありません</p>
                <p className="text-xs text-muted-foreground mt-1">クリエイターのプロフィールから登録できます</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!subscriptionToCancel} onOpenChange={(open) => !open && setSubscriptionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>サブスクリプションを解約しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{subscriptionToCancel?.creatorDisplayName || subscriptionToCancel?.creatorId}」の「{subscriptionToCancel?.planName || `Tier ${subscriptionToCancel?.tier}`}」プランを解約します。
              解約すると、プレミアムコンテンツにアクセスできなくなります。
              残りの期間分のポイントは返金されません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (subscriptionToCancel) {
                  cancelSubscriptionMutation.mutate(subscriptionToCancel.creatorId);
                }
              }}
              disabled={cancelSubscriptionMutation.isPending}
              data-testid="button-confirm-cancel-subscription"
            >
              {cancelSubscriptionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              解約する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
