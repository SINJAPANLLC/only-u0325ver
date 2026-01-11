import { Home, Radio, ShoppingBag, MessageCircle, User } from "lucide-react";
import { useLocation, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "ホーム" },
  { path: "/live", icon: Radio, label: "LIVE", hasLiveIndicator: true },
  { path: "/shop", icon: ShoppingBag, label: "SHOP" },
  { path: "/messages", icon: MessageCircle, label: "メッセージ", badgeCount: 2 },
  { path: "/account", icon: User, label: "アカウント" },
];

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`nav-${item.path === "/" ? "home" : item.path.slice(1)}`}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-transform",
                      isActive && "scale-110"
                    )} 
                    fill={isActive ? "currentColor" : "none"}
                    strokeWidth={isActive ? 1.5 : 2}
                  />
                  {item.hasLiveIndicator && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-live-pulse" />
                  )}
                  {item.badgeCount && item.badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                    >
                      {item.badgeCount}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
