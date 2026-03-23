import { PiBellSimpleRingingDuotone, PiMagnifyingGlassDuotone } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import { SearchModal } from "@/components/search-modal";
import { NotificationsModal } from "@/components/notifications-modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });
  const notificationCount = unreadData?.count || 0;

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
          <div className="flex items-center px-3 h-14">
            <img
              src={logoImage}
              alt="Only-U"
              className="h-16 object-contain brightness-0 invert"
              data-testid="img-logo"
            />
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
                className="h-12 object-contain"
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
          </div>
        </div>
      )}

      <SearchModal open={showSearchModal} onOpenChange={setShowSearchModal} />
      <NotificationsModal open={showNotificationsModal} onOpenChange={setShowNotificationsModal} />
    </header>
  );
}
