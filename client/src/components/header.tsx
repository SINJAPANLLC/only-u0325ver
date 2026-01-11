import { Bell, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { motion } from "framer-motion";
import logoImage from "@assets/IMG_7372_2_1768100530058.JPG";

interface HeaderProps {
  onSearchClick?: () => void;
}

const languages = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
];

export function Header({ onSearchClick }: HeaderProps) {
  const [currentLang, setCurrentLang] = useState("ja");
  const notificationCount = 3;

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-40 w-full bg-gradient-to-b from-black/40 to-transparent pointer-events-none"
    >
      <div className="flex h-14 items-center justify-between px-4 gap-2 pointer-events-auto">
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <img 
            src={logoImage} 
            alt="Only-U" 
            className="h-10 object-contain brightness-0 invert"
            data-testid="img-logo"
          />
        </motion.div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 hover:bg-white/20 transition-colors text-white"
                data-testid="button-language"
              >
                <Globe className="h-5 w-5 stroke-[1.5] text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setCurrentLang(lang.code)}
                  className={`rounded-lg ${currentLang === lang.code ? "bg-pink-100 dark:bg-pink-900/30" : ""}`}
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
            className="rounded-full h-10 w-10 relative hover:bg-white/20 transition-colors text-white"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5 stroke-[1.5] text-white" />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-0.5 -right-0.5 h-5 min-w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-pink-500 to-rose-500 border-0 animate-pulse"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-10 w-10 hover:bg-white/20 transition-colors text-white"
            onClick={onSearchClick}
            data-testid="button-search"
          >
            <Search className="h-5 w-5 stroke-[1.5] text-white" />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
