import { Button } from "@/components/ui/button";

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
        {/* Registration Button */}
        <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 w-[45%]">
          <Button 
            onClick={onRegisterClick}
            className="w-full h-9 rounded-full text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
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

    </div>
  );
}
