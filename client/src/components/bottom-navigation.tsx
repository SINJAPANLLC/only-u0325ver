import { PiHouseDuotone, PiBroadcastDuotone, PiShoppingBagDuotone, PiChatCircleDotsDuotone, PiUserCircleDuotone } from "react-icons/pi";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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

export function BottomNavigation() {
  const [location] = useLocation();
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = unreadMessages?.count || 0;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-black pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          const showBadge = item.path === "/messages" && unreadCount > 0;

          return (
            <Link key={item.path} href={item.path}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 w-14 h-14 rounded-2xl transition-colors duration-200",
                  isActive ? "text-pink-400" : "text-white/50 hover:text-white/80"
                )}
                data-testid={`nav-${item.path === "/" ? "home" : item.path.slice(1)}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-1 bg-white/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}

                <div className="relative z-10">
                  <Icon className={cn(item.iconSize || "h-6 w-6", "transition-transform duration-200", isActive && "scale-110")} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 h-4 min-w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold px-0.5 shadow-sm">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>

                <span className={cn(
                  "relative z-10 text-[10px] font-medium tracking-wide transition-all duration-200",
                  isActive && "font-semibold"
                )}>
                  {t(item.labelKey)}
                </span>
              </motion.button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
