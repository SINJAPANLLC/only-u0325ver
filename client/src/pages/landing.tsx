import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChevronDown } from "lucide-react";

const section1Image = "/lp-1.png";
const section2Image = "/lp-2.png";
const section3Image = "/lp-3.png";
const detailImage = "/lp-detail.png";
const recruitImage = "/lp-recruit.png";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

export default function Landing() {
  const scrollToNext = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden overflow-y-auto">
      {/* Section 1 - Hero with legs */}
      <section id="section1" className="min-h-screen relative flex flex-col">
        <img 
          src={section1Image}
          alt="Only-U Hero"
          className="w-full h-full object-cover object-center absolute inset-0"
        />
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1" />
          <motion.button
            onClick={() => scrollToNext("section2")}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-8 flex flex-col items-center text-pink-500 cursor-pointer"
            data-testid="button-scroll-section1"
          >
            <span className="text-sm font-medium tracking-widest rotate-90 mb-2">SCROLL</span>
            <ChevronDown className="h-6 w-6" />
          </motion.button>
        </div>
      </section>

      {/* Section 2 - Phone mockup */}
      <section id="section2" className="min-h-screen relative flex flex-col">
        <img 
          src={section2Image}
          alt="Only-U App"
          className="w-full h-full object-cover object-center absolute inset-0"
        />
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1" />
          <motion.button
            onClick={() => scrollToNext("section3")}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mx-auto mb-8 flex flex-col items-center text-pink-500 cursor-pointer"
            data-testid="button-scroll-section2"
          >
            <span className="text-sm font-medium tracking-widest rotate-90 mb-2">SCROLL</span>
            <ChevronDown className="h-6 w-6" />
          </motion.button>
        </div>
      </section>

      {/* Section 3 - Door and CTA */}
      <section id="section3" className="min-h-screen relative flex flex-col">
        <img 
          src={section3Image}
          alt="Only-U Door"
          className="w-full h-full object-cover object-center absolute inset-0"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex-1" />
          <div className="mb-40">
            <a href="/api/login">
              <Button 
                size="lg"
                className="h-14 px-12 rounded-full text-lg font-bold border-2 border-pink-500 bg-transparent text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300"
                data-testid="button-register"
              >
                無料登録
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Section 4 - Detail Banner */}
      <section id="section4" className="relative">
        <img 
          src={detailImage}
          alt="稼げるファンクラブで、物語に彩りを"
          className="w-full object-cover"
        />
      </section>

      {/* Section 5 - Recruit Banner */}
      <section id="section5" className="relative">
        <img 
          src={recruitImage}
          alt="RECRUIT 運営・開発メンバー募集"
          className="w-full object-cover"
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <img 
                src={logoImage} 
                alt="Only-U" 
                className="h-10 object-contain"
              />
              <p className="text-sm text-muted-foreground leading-relaxed">
                クリエイターと繋がる、
                <br />
                新しいプラットフォーム
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground">サービス</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">機能紹介</a></li>
                <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">料金プラン</a></li>
                <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">クリエイター向け</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground">サポート</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">ヘルプセンター</a></li>
                <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">お問い合わせ</a></li>
                <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">よくある質問</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wide text-muted-foreground">法的情報</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/terms" className="text-foreground/70 hover:text-foreground transition-colors">利用規約</a></li>
                <li><a href="/privacy" className="text-foreground/70 hover:text-foreground transition-colors">プライバシーポリシー</a></li>
                <li><a href="/legal" className="text-foreground/70 hover:text-foreground transition-colors">特定商取引法に基づく表記</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Only-U. 運営: 合同会社SIN JAPAN KANAGAWA
            </p>
            <p className="text-sm text-muted-foreground">
              info@only-u.jp
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
