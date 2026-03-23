import { PiHouseDuotone, PiBroadcastDuotone, PiShoppingBagDuotone, PiChatCircleDotsDuotone, PiUserCircleDuotone, PiBellSimpleRingingDuotone, PiMagnifyingGlassDuotone, PiGlobeHemisphereEastDuotone } from "react-icons/pi";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchModal } from "@/components/search-modal";
import { NotificationsModal } from "@/components/notifications-modal";

interface NavItem {
  path: string;
  icon: IconType;
  labelKey: string;
  iconSize?: string;
}

const navItems: NavItem[] = [
  { path: "/", icon: PiHouseDuotone, labelKey: "nav.home", iconSize: "h-6 w-6" },
  { path: "/live", icon: PiBroadcastDuotone, labelKey: "nav.live", iconSize: "h-6 w-6" },
  { path: "/shop", icon: PiShoppingBagDuotone, labelKey: "nav.shop", iconSize: "h-6 w-6" },
  { path: "/messages", icon: PiChatCircleDotsDuotone, labelKey: "nav.messages", iconSize: "h-6 w-6" },
  { path: "/account", icon: PiUserCircleDuotone, labelKey: "nav.account", iconSize: "h-6 w-6" },
];

const languages = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
];

export function SidebarNavigation() {
  const [location] = useLocation();
  const { t } = useI18n();
  const { language, setLanguage } = useI18n();
  const { user } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: unreadNotifications } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadMsgCount = unreadMessages?.count || 0;
  const unreadNotifCount = unreadNotifications?.count || 0;

  if (!user) return null;

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-black border-r border-white/10 fixed left-0 top-0 bottom-0 z-40">
        <div className="p-5 border-b border-white/10">
          <img
            src={logoImage}
            alt="Only-U"
            className="h-14 object-contain brightness-0 invert"
            data-testid="img-logo-sidebar"
          />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            const showBadge = item.path === "/messages" && unreadMsgCount > 0;

            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-pink-500/20 to-rose-500/10 text-pink-400"
                      : "text-white/50 hover:bg-white/10 hover:text-white"
                  )}
                  data-testid={`sidebar-nav-${item.path === "/" ? "home" : item.path.slice(1)}`}
                >
                  <div className="relative">
                    <Icon className={cn(item.iconSize || "h-6 w-6")} />
                    {showBadge && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold">
                        {unreadMsgCount > 99 ? "99+" : unreadMsgCount}
                      </span>
                    )}
                  </div>
                  <span className={cn("font-medium text-sm", isActive && "font-semibold text-white")}>
                    {t(item.labelKey)}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-pink-500 to-rose-500"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setShowNotificationsModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200"
            data-testid="sidebar-notifications"
          >
            <div className="relative">
              <PiBellSimpleRingingDuotone className="h-6 w-6" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold">
                  {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                </span>
              )}
            </div>
            <span className="text-sm font-medium">通知</span>
          </button>

          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200"
            data-testid="sidebar-search"
          >
            <PiMagnifyingGlassDuotone className="h-6 w-6" />
            <span className="text-sm font-medium">検索</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/50 hover:bg-white/10 hover:text-white transition-all duration-200"
                data-testid="sidebar-language"
              >
                <PiGlobeHemisphereEastDuotone className="h-6 w-6" />
                <span className="text-sm font-medium">言語</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="min-w-[140px] rounded-xl bg-zinc-900 border border-white/10 text-white">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={cn("rounded-lg text-white/70 hover:text-white focus:text-white focus:bg-white/10", language === lang.code && "bg-pink-500/20 text-pink-400 focus:bg-pink-500/20 focus:text-pink-400")}
                  data-testid={`sidebar-lang-${lang.code}`}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <SearchModal open={showSearchModal} onOpenChange={setShowSearchModal} />
      <NotificationsModal open={showNotificationsModal} onOpenChange={setShowNotificationsModal} />
    </>
  );
}
