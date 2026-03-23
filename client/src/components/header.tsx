import { PiGlobeHemisphereEastDuotone, PiBellSimpleRingingDuotone, PiMagnifyingGlassDuotone, PiDownloadSimpleDuotone } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { SearchModal } from "@/components/search-modal";
import { NotificationsModal } from "@/components/notifications-modal";
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant?: "overlay" | "solid";
  onSearchClick?: () => void;
  feedType?: "recommend" | "following";
  onFeedTypeChange?: (type: "recommend" | "following") => void;
  showFeedTabs?: boolean;
}

const languages = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
];

const pageTitles: Record<string, string> = {
  "/shop": "ショップ",
  "/messages": "メッセージ",
  "/account": "アカウント",
  "/following": "フォロー中",
  "/notifications": "通知",
  "/points-purchase": "ポイント購入",
  "/my-purchases": "購入履歴",
  "/payment-methods": "お支払い方法",
  "/personal-info": "本人情報",
  "/phone-verification": "電話番号認証",
  "/email-verification": "メール認証",
  "/language-settings": "言語設定",
  "/notification-settings": "通知設定",
  "/privacy-settings": "プライバシー設定",
};

export function Header({
  variant = "solid",
  feedType = "recommend",
  onFeedTypeChange,
  showFeedTabs = false,
}: HeaderProps) {
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { isInstallable, isInstalled, install } = usePwaInstall();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });
  const notificationCount = unreadData?.count || 0;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallDialog(true);
    }
  };

  const pageTitle = pageTitles[location];
  const isOverlay = variant === "overlay";

  return (
    <header
      className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-40 w-full max-w-[430px] mx-auto pt-safe",
        isOverlay
          ? "bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none"
          : "bg-background/95 backdrop-blur-xl border-b border-border/40"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-4 gap-2",
          isOverlay ? "h-16 pointer-events-auto" : "h-14"
        )}
      >
        {/* Left side: logo or page title */}
        <div className="flex flex-col items-start min-w-0">
          {isOverlay ? (
            <img
              src={logoImage}
              alt="Only-U"
              className="h-14 object-contain brightness-0 invert"
              data-testid="img-logo"
            />
          ) : pageTitle ? (
            <h1 className="text-lg font-bold text-foreground truncate">{pageTitle}</h1>
          ) : (
            <img
              src={logoImage}
              alt="Only-U"
              className="h-10 object-contain dark:invert"
              data-testid="img-logo"
            />
          )}

          {showFeedTabs && isOverlay && (
            <div className="flex items-center gap-5 mt-0.5">
              <button
                onClick={() => onFeedTypeChange?.("recommend")}
                className={cn(
                  "text-sm font-semibold whitespace-nowrap transition-all pb-0.5",
                  feedType === "recommend"
                    ? "text-white border-b-2 border-white"
                    : "text-white/55"
                )}
                data-testid="button-feed-recommend"
              >
                {t("feed.recommend")}
              </button>
              <button
                onClick={() => onFeedTypeChange?.("following")}
                className={cn(
                  "text-sm font-semibold whitespace-nowrap transition-all pb-0.5",
                  feedType === "following"
                    ? "text-white border-b-2 border-white"
                    : "text-white/55"
                )}
                data-testid="button-feed-following"
              >
                {t("feed.following")}
              </button>
            </div>
          )}
        </div>

        {/* Right side: action buttons */}
        <div className={cn("flex items-center", isOverlay ? "gap-0 -mr-1" : "gap-0.5")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full transition-colors",
                  isOverlay
                    ? "h-12 w-12 text-white hover:bg-white/20"
                    : "h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                data-testid="button-language"
              >
                <PiGlobeHemisphereEastDuotone
                  className={isOverlay ? "h-7 w-7 drop-shadow" : "h-5 w-5"}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(
                "min-w-[140px] rounded-xl",
                isOverlay && "bg-black/80 backdrop-blur-xl border-white/20"
              )}
            >
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={cn(
                    "rounded-lg",
                    isOverlay
                      ? `text-white hover:bg-white/20 ${language === lang.code ? "bg-white/15" : ""}`
                      : language === lang.code ? "bg-pink-500/10 text-pink-600 dark:text-pink-400" : ""
                  )}
                  data-testid={`menu-item-lang-${lang.code}`}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full relative transition-colors",
              isOverlay
                ? "h-12 w-12 text-white hover:bg-white/20"
                : "h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onClick={() => setShowNotificationsModal(true)}
            data-testid="button-notifications"
          >
            <PiBellSimpleRingingDuotone className={isOverlay ? "h-7 w-7 drop-shadow" : "h-5 w-5"} />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold shadow">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-colors",
              isOverlay
                ? "h-12 w-12 text-white hover:bg-white/20"
                : "h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onClick={() => setShowSearchModal(true)}
            data-testid="button-search"
          >
            <PiMagnifyingGlassDuotone className={isOverlay ? "h-7 w-7 drop-shadow" : "h-5 w-5"} />
          </Button>

          {!isInstalled && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full transition-colors",
                isOverlay
                  ? "h-12 w-12 text-white hover:bg-white/20"
                  : "h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              onClick={handleInstallClick}
              data-testid="button-install"
            >
              <PiDownloadSimpleDuotone className={isOverlay ? "h-7 w-7 drop-shadow" : "h-5 w-5"} />
            </Button>
          )}

          <ThemeToggle variant={isOverlay ? "overlay" : "solid"} />
        </div>
      </div>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">ホーム画面に追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isIOS ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">iPhoneでアプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>画面下の<span className="font-bold">共有ボタン</span>をタップ</li>
                  <li>「<span className="font-bold">ホーム画面に追加</span>」を選択</li>
                  <li>右上の「<span className="font-bold">追加</span>」をタップ</li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">Androidでアプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>ブラウザの<span className="font-bold">メニュー（︙）</span>をタップ</li>
                  <li>「<span className="font-bold">ホーム画面に追加</span>」を選択</li>
                  <li>「<span className="font-bold">追加</span>」をタップ</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">アプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>ブラウザのメニューを開く</li>
                  <li>「ホーム画面に追加」または「アプリをインストール」を選択</li>
                </ol>
              </div>
            )}
            <Button
              onClick={() => setShowInstallDialog(false)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SearchModal open={showSearchModal} onOpenChange={setShowSearchModal} />
      <NotificationsModal open={showNotificationsModal} onOpenChange={setShowNotificationsModal} />
    </header>
  );
}
