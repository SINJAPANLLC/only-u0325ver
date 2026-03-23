import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const languages = [
  { code: "ja", name: "日本語", native: "日本語", flag: "🇯🇵" },
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", native: "中文", flag: "🇨🇳" },
  { code: "ko", name: "한국어", native: "한국어", flag: "🇰🇷" },
] as const;

export default function LanguageSettingsPage() {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useI18n();

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-base">言語設定</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 px-1 mb-4">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">表示言語</p>
            <p className="text-xs text-white/50">アプリ全体の表示言語を変更</p>
          </div>
        </div>

        <div className="space-y-2">
          {languages.map((lang, index) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                language === lang.code
                  ? "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-300/60 dark:border-pink-800/60"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
              onClick={() => setLanguage(lang.code)}
              data-testid={`button-lang-${lang.code}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className={`font-semibold text-sm ${language === lang.code ? "text-pink-600 dark:text-pink-400" : ""}`}>
                    {lang.native}
                  </p>
                  <p className="text-xs text-white/50">{lang.name}</p>
                </div>
              </div>
              {language === lang.code && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
