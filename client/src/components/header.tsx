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
        "lg:hidden fixed top-0 left-0 right-0 z-40 w-full pt-safe",
        isOverlay
          ? "bg-gradient-to-b from-black/40 via-black/15 to-transparent pointer-events-none"
          : "bg-background/95 backdrop-blur-xl border-b border-border/40"
      )}
    >
      {isOverlay ? (
        /* Overlay layout: logo + icons on one row, feed tabs below */
        <div className="pointer-events-auto">
          <div className="flex items-center justify-between px-3 h-20">
            {/* Large logo */}
            <img
              src={logoImage}
              alt="Only-U"
              className="h-16 object-contain brightness-0 invert"
              data-testid="img-logo"
            />

            {/* Right icon buttons */}
            <div className="flex items-center gap-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full text-white hover:bg-white/20"
                    data-testid="button-language"
                  >
                    <PiGlobeHemisphereEastDuotone className="h-8 w-8 drop-shadow-md" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="min-w-[140px] rounded-xl bg-black/80 backdrop-blur-xl border-white/20"
                >
                  {languages.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code as any)}
                      className={cn(
                        "rounded-lg text-white hover:bg-white/20",
                        language === lang.code && "bg-white/15"
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
                className="h-12 w-12 rounded-full relative text-white hover:bg-white/20"
                onClick={() => setShowNotificationsModal(true)}
                data-testid="button-notifications"
              >
                <PiBellSimpleRingingDuotone className="h-8 w-8 drop-shadow-md" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold shadow">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full text-white hover:bg-white/20"
                onClick={() => setShowSearchModal(true)}
                data-testid="button-search"
              >
                <PiMagnifyingGlassDuotone className="h-8 w-8 drop-shadow-md" />
              </Button>

              {!isInstalled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full text-white hover:bg-white/20"
                  onClick={handleInstallClick}
                  data-testid="button-install"
                >
                  <PiDownloadSimpleDuotone className="h-8 w-8 drop-shadow-md" />
                </Button>
              )}

              <ThemeToggle variant="overlay" />
            </div>
          </div>

          {/* Feed tabs row */}
          {showFeedTabs && (
            <div className="flex items-center gap-6 px-4 pb-2">
              <button
                onClick={() => onFeedTypeChange?.("recommend")}
                className={cn(
                  "text-base font-bold whitespace-nowrap transition-all pb-0.5",
                  feedType === "recommend"
                    ? "text-white border-b-2 border-white"
                    : "text-white/50"
                )}
                data-testid="button-feed-recommend"
              >
                {t("feed.recommend")}
              </button>
              <button
                onClick={() => onFeedTypeChange?.("following")}
                className={cn(
                  "text-base font-bold whitespace-nowrap transition-all pb-0.5",
                  feedType === "following"
                    ? "text-white border-b-2 border-white"
                    : "text-white/50"
                )}
                data-testid="button-feed-following"
              >
                {t("feed.following")}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Solid layout: page title or logo + action icons */
        <div className="flex h-14 items-center justify-between px-4 gap-2">
          <div className="min-w-0">
            {pageTitle ? (
              <h1 className="text-lg font-bold text-foreground truncate">{pageTitle}</h1>
            ) : (
              <img
                src={logoImage}
                alt="Only-U"
                className="h-10 object-contain dark:invert"
                data-testid="img-logo"
              />
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                  data-testid="button-language"
                >
                  <PiGlobeHemisphereEastDuotone className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as any)}
                    className={cn(
                      "rounded-lg",
                      language === lang.code && "bg-pink-500/10 text-pink-600 dark:text-pink-400"
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
              className="h-10 w-10 rounded-full relative text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setShowNotificationsModal(true)}
              data-testid="button-notifications"
            >
              <PiBellSimpleRingingDuotone className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold shadow">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setShowSearchModal(true)}
              data-testid="button-search"
            >
              <PiMagnifyingGlassDuotone className="h-5 w-5" />
            </Button>

            {!isInstalled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={handleInstallClick}
                data-testid="button-install"
              >
                <PiDownloadSimpleDuotone className="h-5 w-5" />
              </Button>
            )}

            <ThemeToggle variant="solid" />
          </div>
        </div>
      )}

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
