import { Home, Radio, ShoppingBag, MessageCircle, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { path: "/", icon: Home, label: "ホーム" },
  { path: "/live", icon: Radio, label: "LIVE", hasLiveIndicator: true },
  { path: "/shop", icon: ShoppingBag, label: "ショップ" },
  { path: "/messages", icon: MessageCircle, label: "DM", badgeCount: 5 },
  { path: "/account", icon: User, label: "マイページ" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-transparent backdrop-blur-xl border-t border-white/10 dark:border-white/5 pb-safe"
    >
      <div className="flex items-center justify-around h-[72px] max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 w-16 h-full rounded-2xl transition-all duration-200",
                  isActive 
                    ? "text-pink-500" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.path === "/" ? "home" : item.path.slice(1)}`}
              >
                {/* Active background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active-bg"
                    className="absolute inset-1 bg-pink-100 dark:bg-pink-900/30 rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                
                <div className="relative z-10">
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      isActive && "scale-110"
                    )} 
                    fill={isActive ? "currentColor" : "none"}
                    strokeWidth={isActive ? 1.5 : 2}
                  />
                  
                  {/* Live pulse indicator */}
                  {item.hasLiveIndicator && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-live-pulse shadow-lg shadow-red-500/50" />
                  )}
                  
                  {/* Badge for messages */}
                  {item.badgeCount && item.badgeCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-3 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-gradient-to-r from-pink-500 to-rose-500 border-0 shadow-lg"
                    >
                      {item.badgeCount > 99 ? "99+" : item.badgeCount}
                    </Badge>
                  )}
                </div>
                
                <span className={cn(
                  "relative z-10 text-[10px] font-medium tracking-wide",
                  isActive && "font-bold text-pink-600 dark:text-pink-400"
                )}>
                  {item.label}
                </span>
              </motion.button>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
