import { PiHouseDuotone, PiBroadcastDuotone, PiShoppingBagDuotone, PiChatCircleDotsDuotone, PiUserCircleDuotone } from "react-icons/pi";
import { useLocation, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { IconType } from "react-icons";

interface NavItem {
  path: string;
  icon: IconType;
  label: string;
  hasLiveIndicator?: boolean;
  badgeCount?: number;
}

const navItems: NavItem[] = [
  { path: "/", icon: PiHouseDuotone, label: "ホーム" },
  { path: "/live", icon: PiBroadcastDuotone, label: "LIVE", hasLiveIndicator: true },
  { path: "/shop", icon: PiShoppingBagDuotone, label: "ショップ" },
  { path: "/messages", icon: PiChatCircleDotsDuotone, label: "DM", badgeCount: 5 },
  { path: "/account", icon: PiUserCircleDuotone, label: "マイページ" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-gradient-to-t from-black/70 via-black/40 to-transparent pb-safe pointer-events-none"
    >
      <div className="flex items-center justify-around h-[72px] max-w-lg mx-auto px-2 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-16 h-full rounded-full transition-all duration-300",
                  isActive 
                    ? "text-white" 
                    : "text-white/60 hover:text-white/90"
                )}
                data-testid={`nav-${item.path === "/" ? "home" : item.path.slice(1)}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-bg"
                    className="absolute inset-1 bg-white/15 backdrop-blur-sm rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                
                <div className="relative z-10">
                  <Icon 
                    className={cn(
                      "h-7 w-7 transition-all duration-300",
                      isActive && "scale-110"
                    )} 
                  />
                  
                  {item.hasLiveIndicator && (
                    <motion.span 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/60 ring-2 ring-black/30" 
                    />
                  )}
                  
                  {item.badgeCount && item.badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold shadow-lg">
                      {item.badgeCount > 99 ? "99+" : item.badgeCount}
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "relative z-10 text-[10px] font-medium tracking-wide transition-all duration-300",
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
              </motion.button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
