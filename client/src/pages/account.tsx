import { motion } from "framer-motion";
import { 
  User, Settings, CreditCard, ShoppingBag, Heart, Bell, 
  HelpCircle, FileText, Shield, LogOut, ChevronRight,
  Radio, Package, BarChart3, Wallet, Star, Globe
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

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
  const [isCreator, setIsCreator] = useState(false);

  if (isLoading) {
    return (
      <div className="pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const userMenuItems: MenuItemProps[] = [
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

  return (
    <div className="pb-20">
      <div className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/10 to-pink-400/10 p-6"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary ring-offset-2 ring-offset-background">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "ゲスト"
                }
              </h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full"
              data-testid="button-edit-profile"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <Separator className="my-4 bg-border/50" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">クリエイターモード</p>
                <p className="text-xs text-muted-foreground">
                  {isCreator ? "配信・販売が可能です" : "クリエイター機能をオン"}
                </p>
              </div>
            </div>
            <Switch 
              checked={isCreator} 
              onCheckedChange={setIsCreator}
              data-testid="switch-creator-mode"
            />
          </div>
        </motion.div>

        {isCreator && (
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
