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
    <header className="sticky top-0 z-40 w-full glass border-b border-border/50">
      <div className="flex h-14 items-center justify-between px-4 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center shadow-sm">
            <span className="text-lg font-bold text-white">U</span>
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:inline">Only-U</span>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                data-testid="button-language"
              >
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setCurrentLang(lang.code)}
                  className={currentLang === lang.code ? "bg-accent" : ""}
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
            className="rounded-full relative"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={onSearchClick}
            data-testid="button-search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
