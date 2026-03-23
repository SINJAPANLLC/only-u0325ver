import { PiBellSimpleRingingDuotone, PiMagnifyingGlassDuotone, PiDownloadSimpleDuotone } from "react-icons/pi";
import { Button } from "@/components/ui/button";
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
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { SearchModal } from "@/components/search-modal";
import { NotificationsModal } from "@/components/notifications-modal";
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant?: "overlay" | "solid";
  onSearchClick?: () => void;
}

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

export function Header({ variant = "solid" }: HeaderProps) {
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
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
          ? "bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none"
          : "bg-white/95 backdrop-blur-xl border-b border-pink-100"
      )}
    >
      {isOverlay ? (
        <div className="pointer-events-auto">
          <div className="flex items-center justify-between px-3 h-14">
            <img
              src={logoImage}
              alt="Only-U"
              className="h-10 object-contain brightness-0 invert"
              data-testid="img-logo"
            />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full relative text-white hover:bg-white/20"
                onClick={() => setShowNotificationsModal(true)}
                data-testid="button-notifications"
              >
                <PiBellSimpleRingingDuotone className="h-5 w-5 drop-shadow" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-pink-500 text-white text-[8px] font-bold shadow">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                onClick={() => setShowSearchModal(true)}
                data-testid="button-search"
              >
                <PiMagnifyingGlassDuotone className="h-5 w-5 drop-shadow" />
              </Button>

              {!isInstalled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-white hover:bg-white/20"
                  onClick={handleInstallClick}
                  data-testid="button-install"
                >
                  <PiDownloadSimpleDuotone className="h-5 w-5 drop-shadow" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-14 items-center justify-between px-4 gap-2">
          <div className="min-w-0">
            {pageTitle ? (
              <h1 className="text-lg font-bold text-gray-900 truncate">{pageTitle}</h1>
            ) : (
              <img
                src={logoImage}
                alt="Only-U"
                className="h-9 object-contain"
                data-testid="img-logo"
              />
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full relative text-gray-500 hover:text-gray-800 hover:bg-pink-50"
              onClick={() => setShowNotificationsModal(true)}
              data-testid="button-notifications"
            >
              <PiBellSimpleRingingDuotone className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-pink-500 text-white text-[8px] font-bold shadow">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-pink-50"
              onClick={() => setShowSearchModal(true)}
              data-testid="button-search"
            >
              <PiMagnifyingGlassDuotone className="h-5 w-5" />
            </Button>

            {!isInstalled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-gray-500 hover:text-gray-800 hover:bg-pink-50"
                onClick={handleInstallClick}
                data-testid="button-install"
              >
                <PiDownloadSimpleDuotone className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-sm rounded-3xl border border-pink-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">ホーム画面に追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isIOS ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">iPhoneでアプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>画面下の<span className="font-bold text-gray-900">共有ボタン</span>をタップ</li>
                  <li>「<span className="font-bold text-gray-900">ホーム画面に追加</span>」を選択</li>
                  <li>右上の「<span className="font-bold text-gray-900">追加</span>」をタップ</li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">Androidでアプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>ブラウザの<span className="font-bold text-gray-900">メニュー（︙）</span>をタップ</li>
                  <li>「<span className="font-bold text-gray-900">ホーム画面に追加</span>」を選択</li>
                  <li>「<span className="font-bold text-gray-900">追加</span>」をタップ</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center">アプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>ブラウザのメニューを開く</li>
                  <li>「ホーム画面に追加」または「アプリをインストール」を選択</li>
                </ol>
              </div>
            )}
            <Button
              onClick={() => setShowInstallDialog(false)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white rounded-2xl h-11 font-semibold"
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
