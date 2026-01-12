import { PiGlobeHemisphereEastDuotone, PiBellSimpleRingingDuotone, PiMagnifyingGlassDuotone, PiDownloadSimpleDuotone } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { motion } from "framer-motion";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import { usePwaInstall } from "@/hooks/use-pwa-install";

interface HeaderProps {
  onSearchClick?: () => void;
  feedType?: "recommend" | "following";
  onFeedTypeChange?: (type: "recommend" | "following") => void;
}

const languages = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국어" },
];

export function Header({ onSearchClick, feedType = "recommend", onFeedTypeChange }: HeaderProps) {
  const [currentLang, setCurrentLang] = useState("ja");
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const notificationCount = 3;
  const { isInstallable, isInstalled, install } = usePwaInstall();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallDialog(true);
    }
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-0 left-0 right-0 z-40 w-full bg-gradient-to-b from-black/40 to-transparent pointer-events-none"
    >
      <div className="flex h-20 items-center justify-between px-4 gap-2 pointer-events-auto pt-4">
        <div className="flex flex-col items-start">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
          >
            <img 
              src={logoImage} 
              alt="Only-U" 
              className="h-16 object-contain brightness-0 invert"
              data-testid="img-logo"
            />
          </motion.div>
          <div className="flex items-center gap-4 ml-1 -mt-1">
            <button
              onClick={() => onFeedTypeChange?.("recommend")}
              className={`text-sm font-medium whitespace-nowrap transition-all ${
                feedType === "recommend" 
                  ? "text-white" 
                  : "text-white/50"
              }`}
              data-testid="button-feed-recommend"
            >
              おすすめ
            </button>
            <button
              onClick={() => onFeedTypeChange?.("following")}
              className={`text-sm font-medium whitespace-nowrap transition-all ${
                feedType === "following" 
                  ? "text-white" 
                  : "text-white/50"
              }`}
              data-testid="button-feed-following"
            >
              フォロー中
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 -mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-12 w-12 hover:bg-white/20 hover:scale-105 transition-all duration-300 text-white"
                data-testid="button-language"
              >
                <PiGlobeHemisphereEastDuotone className="h-10 w-10 text-white drop-shadow-sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] rounded-xl bg-black/80 backdrop-blur-xl border-white/20">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setCurrentLang(lang.code)}
                  className={`rounded-lg text-white hover:bg-white/20 ${currentLang === lang.code ? "bg-gradient-to-r from-pink-500/30 to-rose-500/30" : ""}`}
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
            className="rounded-full h-12 w-12 relative hover:bg-white/20 hover:scale-105 transition-all duration-300 text-white"
            data-testid="button-notifications"
          >
            <PiBellSimpleRingingDuotone className="h-10 w-10 text-white drop-shadow-sm" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center rounded-full bg-pink-500 text-white text-[9px] font-bold shadow-lg">
                {notificationCount}
              </span>
            )}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-12 w-12 hover:bg-white/20 hover:scale-105 transition-all duration-300 text-white"
            onClick={onSearchClick}
            data-testid="button-search"
          >
            <PiMagnifyingGlassDuotone className="h-10 w-10 text-white drop-shadow-sm" />
          </Button>

          {!isInstalled && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-12 w-12 hover:bg-white/20 hover:scale-105 transition-all duration-300 text-white"
              onClick={handleInstallClick}
              data-testid="button-install"
            >
              <PiDownloadSimpleDuotone className="h-10 w-10 text-white drop-shadow-sm" />
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-sm rounded-2xl bg-black/90 backdrop-blur-xl border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              ホーム画面に追加
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isIOS ? (
              <div className="space-y-3">
                <p className="text-sm text-white/80 text-center">iPhoneでアプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-white/90">
                  <li>画面下の<span className="font-bold">共有ボタン</span>をタップ</li>
                  <li>「<span className="font-bold">ホーム画面に追加</span>」を選択</li>
                  <li>右上の「<span className="font-bold">追加</span>」をタップ</li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3">
                <p className="text-sm text-white/80 text-center">Androidでアプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-white/90">
                  <li>ブラウザの<span className="font-bold">メニュー（︙）</span>をタップ</li>
                  <li>「<span className="font-bold">ホーム画面に追加</span>」を選択</li>
                  <li>「<span className="font-bold">追加</span>」をタップ</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-white/80 text-center">アプリをインストール：</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-white/90">
                  <li>ブラウザのメニューを開く</li>
                  <li>「ホーム画面に追加」または「アプリをインストール」を選択</li>
                </ol>
              </div>
            )}
            <Button 
              onClick={() => setShowInstallDialog(false)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.header>
  );
}
