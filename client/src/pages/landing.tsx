import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

const section1Image = "/lp-1.png";
const section2Image = "/lp-2.png";
const section3Image = "/lp-3.png";
const detailImage = "/lp-detail.png";
const recruitImage = "/lp-recruit.png";

export default function Landing() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-white">
      {/* Section 1 - Hero with legs */}
      <section className="relative w-full">
        <img 
          src={section1Image}
          alt="Only-U Hero"
          className="w-full h-auto"
          data-testid="img-section1"
        />
      </section>

      {/* Section 2 - Phone mockup */}
      <section className="relative w-full">
        <img 
          src={section2Image}
          alt="Only-U App"
          className="w-full h-auto"
          data-testid="img-section2"
        />
      </section>

      {/* Section 3 - Door and CTA */}
      <section className="relative w-full">
        <img 
          src={section3Image}
          alt="Only-U Door"
          className="w-full h-auto"
          data-testid="img-section3"
        />
        {/* Overlay for registration button */}
        <div className="absolute bottom-[30%] left-0 right-0 flex justify-center">
          <a href="/api/login">
            <Button 
              size="lg"
              className="h-12 px-10 rounded-full text-base font-bold border-2 border-pink-500 bg-transparent text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300"
              data-testid="button-register"
            >
              無料登録
            </Button>
          </a>
        </div>
      </section>

      {/* Section 4 - Detail Banner */}
      <section className="relative w-full">
        <img 
          src={detailImage}
          alt="稼げるファンクラブで、物語に彩りを"
          className="w-full h-auto"
          data-testid="img-section4"
        />
      </section>

      {/* Section 5 - Recruit Banner */}
      <section className="relative w-full">
        <img 
          src={recruitImage}
          alt="RECRUIT 運営・開発メンバー募集"
          className="w-full h-auto"
          data-testid="img-section5"
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="px-4">
          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <img 
                src={logoImage} 
                alt="Only-U" 
                className="h-10 object-contain mx-auto"
              />
              <p className="text-sm text-gray-500 leading-relaxed">
                クリエイターと繋がる、新しいプラットフォーム
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <h4 className="font-bold mb-3 text-xs uppercase tracking-wide text-gray-400">サービス</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">機能紹介</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">料金プラン</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">クリエイター向け</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-xs uppercase tracking-wide text-gray-400">サポート</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">ヘルプセンター</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">お問い合わせ</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-gray-900">よくある質問</a></li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-bold mb-3 text-xs uppercase tracking-wide text-gray-400">法的情報</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="text-gray-600 hover:text-gray-900">利用規約</a></li>
                <li><a href="/privacy" className="text-gray-600 hover:text-gray-900">プライバシーポリシー</a></li>
                <li><a href="/legal" className="text-gray-600 hover:text-gray-900">特定商取引法に基づく表記</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-6 text-center">
            <p className="text-xs text-gray-400">
              © 2024 Only-U. 運営: 合同会社SIN JAPAN KANAGAWA
            </p>
            <p className="text-xs text-gray-400 mt-1">
              info@only-u.jp
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
