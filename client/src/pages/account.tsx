import { motion } from "framer-motion";
import { 
  User, Settings, CreditCard, ShoppingBag, Heart, Bell, 
  HelpCircle, FileText, Shield, LogOut, ChevronRight,
  Radio, Package, BarChart3, Wallet, Star, Globe, Send, Clock, CheckCircle, XCircle, Edit, Eye, Phone, Mail, Crown, Loader2, Trash2
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
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function Account() {
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isSubscriptionsDialogOpen, setIsSubscriptionsDialogOpen] = useState(false);
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);
  
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

  const { data: userSubscriptions, isLoading: isLoadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    enabled: !!user,
  });

  interface PremiumPlanStatus {
    hasPremium: boolean;
    plan: {
      id: string;
      expiresAt: string | null;
      autoRenew: boolean;
    } | null;
    price: number;
  }

  const { data: premiumStatus } = useQuery<PremiumPlanStatus>({
    queryKey: ["/api/premium-plan"],
    enabled: !!user,
  });

  const subscribePremiumMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/premium-plan/subscribe");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premium-plan"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setIsPremiumDialogOpen(false);
      toast({ title: "高画質プランに加入しました" });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "加入に失敗しました", 
        variant: "destructive" 
      });
    },
  });

  const cancelPremiumMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/premium-plan");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/premium-plan"] });
      toast({ title: "自動更新を停止しました" });
    },
    onError: () => {
      toast({ title: "解約に失敗しました", variant: "destructive" });
    },
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
    { icon: User, label: "プロフィール", description: "自分のプロフィールを見る", onClick: () => setLocation("/my-profile") },
    { 
      icon: Eye, 
      label: "高画質プラン", 
      description: premiumStatus?.hasPremium ? "4K画質で視聴中" : "4K画質で視聴", 
      badge: premiumStatus?.hasPremium ? "加入中" : "980pt/月",
      onClick: () => setIsPremiumDialogOpen(true) 
    },
    { icon: Star, label: "加入中のプラン", description: "サブスクリプション管理", badge: userSubscriptions && userSubscriptions.length > 0 ? `${userSubscriptions.length}件` : undefined, onClick: () => setIsSubscriptionsDialogOpen(true) },
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold truncate">{displayName}</h2>
                <Link href="/points-purchase">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 hover-elevate cursor-pointer whitespace-nowrap" data-testid="link-points-purchase">
                    <span className="text-xs text-pink-600 dark:text-pink-400">所持ポイント</span>
                    <span className="text-sm font-semibold text-pink-700 dark:text-pink-400" data-testid="text-user-points">{(profile?.points ?? 0).toLocaleString()}</span>
                    <span className="text-xs text-pink-500 dark:text-pink-400">| 購入はこちら</span>
                  </div>
                </Link>
              </div>
              {profile?.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{profile.bio}</p>
              )}
            </div>
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

            {!isApprovedCreator && (
              <Link href="/creator-application">
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
                  data-testid="button-apply-creator"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isPendingApplication ? "申請状況を確認" : "クリエイター申請する"}
                </Button>
              </Link>
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

      </div>

      <Dialog open={isSubscriptionsDialogOpen} onOpenChange={setIsSubscriptionsDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>加入中のプラン</DialogTitle>
            <DialogDescription>
              現在加入中のサブスクリプションを管理できます
            </DialogDescription>
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
                  className="flex items-center justify-between p-4 rounded-lg bg-muted"
                  data-testid={`subscription-item-${subscription.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">@{subscription.creatorId}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Tier {subscription.tier}</span>
                        <span>•</span>
                        <span>
                          {subscription.expiresAt 
                            ? `有効期限: ${new Date(subscription.expiresAt).toLocaleDateString("ja-JP")}`
                            : "アクティブ"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setSubscriptionToCancel(subscription)}
                    data-testid={`button-cancel-subscription-${subscription.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Crown className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">加入中のプランはありません</p>
                <p className="text-xs text-muted-foreground mt-1">
                  クリエイターのプロフィールから登録できます
                </p>
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
              @{subscriptionToCancel?.creatorId} のサブスクリプションを解約します。
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
              {cancelSubscriptionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              解約する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Premium Plan Dialog */}
      <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              高画質プラン
            </DialogTitle>
            <DialogDescription>
              4K・最高画質でコンテンツを視聴できます
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold">高画質プラン</span>
                <span className="text-2xl font-bold text-yellow-600">980<span className="text-sm">pt/月</span></span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-yellow-500" />
                  4K・最高画質でのコンテンツ視聴
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  全クリエイターのコンテンツに適用
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  いつでも解約可能
                </li>
              </ul>
            </div>

            {premiumStatus?.hasPremium && premiumStatus.plan && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  加入中
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  有効期限: {premiumStatus.plan.expiresAt 
                    ? new Date(premiumStatus.plan.expiresAt).toLocaleDateString("ja-JP") 
                    : "無期限"}
                </p>
                {premiumStatus.plan.autoRenew && (
                  <p className="text-xs text-muted-foreground">自動更新: オン</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            {premiumStatus?.hasPremium ? (
              <>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsPremiumDialogOpen(false)}
                >
                  閉じる
                </Button>
                {premiumStatus.plan?.autoRenew && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-muted-foreground"
                    onClick={() => cancelPremiumMutation.mutate()}
                    disabled={cancelPremiumMutation.isPending}
                    data-testid="button-cancel-premium"
                  >
                    {cancelPremiumMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    自動更新を停止する
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={() => subscribePremiumMutation.mutate()}
                  disabled={subscribePremiumMutation.isPending || (profile?.points || 0) < 980}
                  data-testid="button-subscribe-premium"
                >
                  {subscribePremiumMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Crown className="h-4 w-4 mr-2" />
                  )}
                  980ptで加入する
                </Button>
                {(profile?.points || 0) < 980 && (
                  <p className="text-xs text-center text-red-500">
                    ポイントが不足しています（所持: {profile?.points || 0}pt）
                  </p>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsPremiumDialogOpen(false)}
                >
                  キャンセル
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
