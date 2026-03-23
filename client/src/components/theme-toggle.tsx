import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "overlay" | "solid";
}

export function ThemeToggle({ variant = "solid" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isOverlay = variant === "overlay";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      data-testid="button-theme-toggle"
      className={cn(
        "rounded-full transition-colors",
        isOverlay
          ? "h-12 w-12 text-white hover:bg-white/20"
          : "h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Sun className={cn("rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0", isOverlay ? "h-7 w-7" : "h-5 w-5")} />
      <Moon className={cn("absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100", isOverlay ? "h-7 w-7" : "h-5 w-5")} />
      <span className="sr-only">テーマ切り替え</span>
    </Button>
  );
}
