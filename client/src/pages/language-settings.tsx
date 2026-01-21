import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Globe,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const languages = [
  { code: "ja", name: "日本語", native: "日本語" },
  { code: "en", name: "English", native: "English" },
  { code: "zh", name: "中文", native: "中文" },
  { code: "ko", name: "한국어", native: "한국어" },
] as const;

export default function LanguageSettingsPage() {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useI18n();

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">言語設定</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">表示言語</h2>
            </div>

            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`w-full flex items-center justify-between p-3 rounded-lg hover-elevate ${
                    language === lang.code ? "bg-primary/10" : ""
                  }`}
                  onClick={() => setLanguage(lang.code)}
                  data-testid={`button-lang-${lang.code}`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{lang.native}</span>
                    <span className="text-sm text-muted-foreground">{lang.name}</span>
                  </div>
                  {language === lang.code && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </Card>

          <p className="text-sm text-muted-foreground text-center mt-4">
            言語を変更すると、アプリ全体の表示言語が変わります。
          </p>
        </motion.div>
      </main>
    </div>
  );
}
