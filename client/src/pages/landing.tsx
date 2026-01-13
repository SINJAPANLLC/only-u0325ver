import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

const section1Image = "/lp-1.png";
const section2Image = "/lp-2.png";
const section3Image = "/lp-3.png";
const detailImage = "/lp-detail.png";
const recruitImage = "/lp-recruit.png";

interface LandingProps {
  onRegisterClick?: () => void;
}

export default function Landing({ onRegisterClick }: LandingProps) {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-white relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-end gap-2 p-3 max-w-[430px] mx-auto">
        <Button 
          onClick={onRegisterClick}
          size="sm"
          className="rounded-full text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white px-4"
          data-testid="button-header-register"
        >
          新規登録
        </Button>
        <Link href="/auth">
          <Button 
            variant="outline"
            size="sm"
            className="rounded-full text-xs font-bold border-pink-500 text-pink-500 hover:bg-pink-50 px-4"
            data-testid="button-header-login"
          >
            ログイン
          </Button>
        </Link>
      </div>

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
        {/* Registration Button */}
        <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 w-[45%]">
          <Button 
            onClick={onRegisterClick}
            className="w-full h-9 rounded-full text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white"
            data-testid="button-register-section3"
          >
            無料登録
          </Button>
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
      <footer className="bg-gray-100 py-10 px-6">
        <div className="flex flex-col items-center space-y-6">
          <img 
            src={logoImage} 
            alt="Only-U" 
            className="h-24 object-contain"
            data-testid="img-footer-logo"
          />
          
          <p className="text-gray-600 text-sm" data-testid="text-copyright">
            &copy; 2025 Only-U. All rights reserved.
          </p>

          <nav className="flex flex-col items-center space-y-4">
            <a 
              href="/terms" 
              className="text-gray-700 text-sm hover:text-pink-500"
              data-testid="link-terms"
            >
              利用規約
            </a>
            <a 
              href="/privacy" 
              className="text-gray-700 text-sm hover:text-pink-500"
              data-testid="link-privacy"
            >
              プライバシーポリシー
            </a>
            <a 
              href="/legal" 
              className="text-gray-700 text-sm hover:text-pink-500"
              data-testid="link-legal"
            >
              特定商取引法に基づく表記
            </a>
            <a 
              href="/guidelines" 
              className="text-gray-700 text-sm hover:text-pink-500"
              data-testid="link-guidelines"
            >
              コンテンツガイドライン
            </a>
          </nav>
        </div>
      </footer>

    </div>
  );
}
