import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import girl1 from "@assets/スクリーンショット_2026-03-23_22.39.41_1774273237678.png";
import girl2 from "@assets/スクリーンショット_2026-03-23_22.39.18_1774273237693.png";
import girl3 from "@assets/スクリーンショット_2026-03-23_22.39.30_1774273237701.png";
import {
  Heart, Shield, Video, ShoppingBag,
  ChevronDown, TrendingUp, Lock,
  Radio, ArrowRight
} from "lucide-react";

interface LandingProps {
  onRegisterClick?: () => void;
}

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-black text-white mb-1">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-pink-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left gap-4"
      >
        <span className="font-medium text-gray-800 text-sm sm:text-base">{question}</span>
        <ChevronDown className={`h-4 w-4 text-pink-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-500 text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Landing({ onRegisterClick }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const faqs = [
    { question: "Only-Uはどんなサービスですか？", answer: "Only-Uは、クリエイターとファンをつなぐ日本発のプレミアムSNSプラットフォームです。写真・動画・ライブ配信・グッズ販売を一つにまとめ、クリエイターの収益化をトータルでサポートします。" },
    { question: "登録は無料ですか？", answer: "はい、ユーザー登録は完全無料です。ポイントを購入してクリエイターのコンテンツにアクセスできます。一部の無料コンテンツは購入なしでも閲覧できます。" },
    { question: "ポイントの仕組みを教えてください", answer: "1ポイント＝1円（税抜）換算です。銀行振込またはカード決済でポイントを購入し、サブスクリプション・コンテンツ購入・投げ銭・ライブ配信などに使用できます。" },
    { question: "クリエイターになるにはどうすれば？", answer: "ユーザー登録後、クリエイター申請フォームから申請できます。審査通過後すぐにコンテンツ投稿・ライブ配信・ショップ開設が可能です。収益は月末締め翌月払いで振込されます。" },
    { question: "プライバシーは保護されますか？", answer: "全コンテンツはアクセス制限付きで公開されます。個人情報は厳重に管理し、AIによる不正コンテンツの自動審査も実施しています。" },
    { question: "退会・解約はいつでもできますか？", answer: "サブスクリプションはいつでも次回更新停止が可能です。アカウント退会も設定から随時申請できます。" },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl border-b border-pink-100" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
          <img src={logoImage} alt="Only-U" className="w-36 h-auto object-contain" />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth?mode=login">
              <button className="text-sm font-medium text-gray-500 hover:text-pink-500 px-3 py-2 transition-colors hidden sm:block" data-testid="button-header-login">
                ログイン
              </button>
            </Link>
            <Button
              onClick={onRegisterClick}
              className="rounded-full text-sm font-bold bg-pink-500 hover:bg-pink-600 text-white px-5 h-9"
              data-testid="button-header-register"
            >
              無料登録
            </Button>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-40 pb-10 bg-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(252,231,243,0.7) 0%, rgba(255,255,255,0) 70%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.7 }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          <h1 className="font-black leading-none tracking-tight mb-6 whitespace-nowrap" style={{ fontSize: "clamp(1.8rem, 4.5vw, 4rem)" }}>
            <span className="text-gray-900">あなたの</span><span className="text-pink-500">推しと、もっと。</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            クリエイターとファンが深くつながる<br className="hidden sm:block" />
            SNSファンクラブプラットフォーム。
          </p>

          <div className="flex gap-5 justify-center items-center mb-10">
            <a href="#" className="flex items-center gap-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-5 py-3 transition-colors" data-testid="button-appstore">
              <svg className="h-6 w-6 fill-white shrink-0" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-42.4-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.9 46.4 42.8 0 109.7-49.1 193.2-49.1 31.2 0 113.7 2.6 178 66.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
              <div className="text-left leading-tight">
                <div className="text-[9px] opacity-80">Download on the</div>
                <div className="text-sm font-bold">App Store</div>
              </div>
            </a>
            <a href="#" className="flex items-center gap-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-5 py-3 transition-colors" data-testid="button-googleplay">
              <svg className="h-6 w-6 fill-white shrink-0" viewBox="0 0 512 512"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l240.6-240.6L47 0zm425.6 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c17.1-9.9 17.1-35.4 0-45.4l-1.2.6zm-230.9 53.4L47 512l280.8-161.2-85.1-72.8z"/></svg>
              <div className="text-left leading-tight">
                <div className="text-[9px] opacity-80">GET IT ON</div>
                <div className="text-sm font-bold">Google Play</div>
              </div>
            </a>
          </div>


        </motion.div>
      </section>

      {/* ── PORTRAIT SLIDER ── */}
      <section className="bg-white pb-10 overflow-hidden">
        <style>{`
          @keyframes marquee-ltr {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-ltr { animation: marquee-ltr 60s linear infinite; }
        `}</style>

        {/* 1列 — 左から右へゆっくり流れる */}
        <div className="flex w-max marquee-ltr gap-4">
          {[
            { img: girl1, label: "Yuki", hearts: "12.4k" },
            { img: girl2, label: "Hana", hearts: "21.1k" },
            { img: girl3, label: "Sora", hearts: "8.7k" },
            { img: girl1, label: "Rina", hearts: "33.0k" },
            { img: girl2, label: "Mio",  hearts: "16.8k" },
            { img: girl3, label: "Aoi",  hearts: "9.2k" },
            { img: girl1, label: "Mei",  hearts: "42.3k" },
            { img: girl2, label: "Risa", hearts: "11.5k" },
            { img: girl3, label: "Emi",  hearts: "18.3k" },
            { img: girl1, label: "Nana", hearts: "7.6k" },
            { img: girl2, label: "Yuki", hearts: "12.4k" },
            { img: girl3, label: "Hana", hearts: "21.1k" },
            { img: girl1, label: "Sora", hearts: "8.7k" },
            { img: girl2, label: "Rina", hearts: "33.0k" },
            { img: girl3, label: "Mio",  hearts: "16.8k" },
            { img: girl1, label: "Aoi",  hearts: "9.2k" },
            { img: girl2, label: "Mei",  hearts: "42.3k" },
            { img: girl3, label: "Risa", hearts: "11.5k" },
            { img: girl1, label: "Emi",  hearts: "18.3k" },
            { img: girl2, label: "Nana", hearts: "7.6k" },
          ].map((card, i) => (
            <div key={i} className="relative shrink-0 w-40 h-64 rounded-2xl overflow-hidden shadow-sm">
              <img src={card.img} alt={card.label} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-xs font-bold leading-none">{card.label}</p>
                <p className="text-white/70 text-[10px] mt-0.5">♡ {card.hearts}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-pink-500 py-14">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-3 gap-8">
            {[
              { target: 10000, suffix: "+", label: "登録クリエイター" },
              { target: 500000, suffix: "+", label: "アクティブファン" },
              { target: 98, suffix: "%", label: "クリエイター満足度" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <AnimatedCounter target={s.target} suffix={s.suffix} />
                <div className="text-xs text-pink-100">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR FANS ── */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <p className="text-pink-400 text-xs font-bold tracking-widest mb-4 uppercase">For Fans</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
                推しの世界に、<br />もっと深く。
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
                限定写真・動画、リアルタイムのライブ配信、2SHOTやパーティーでの特別な交流。あなたの推し活をOne-Stopで。
              </p>
              <Button onClick={onRegisterClick} className="rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold px-7 h-11" data-testid="button-fan-register">
                ファンとして登録 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Video className="h-5 w-5" />, title: "限定コンテンツ視聴", desc: "写真・動画を独占アクセス" },
                { icon: <Radio className="h-5 w-5" />, title: "ライブ配信", desc: "2SHOT・パーティーで交流" },
                { icon: <ShoppingBag className="h-5 w-5" />, title: "限定グッズ購入", desc: "ここだけの商品・デジタル" },
                { icon: <Heart className="h-5 w-5" />, title: "月額サブスク", desc: "継続応援でお得に楽しむ" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-pink-50 rounded-2xl p-5 hover:bg-pink-100 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-pink-500 mb-3 shadow-sm">
                    {f.icon}
                  </div>
                  <div className="font-bold text-gray-800 text-sm mb-1">{f.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR CREATORS ── */}
      <section className="py-24 sm:py-32 bg-pink-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-4 order-2 lg:order-1">
              {[
                { icon: <TrendingUp className="h-5 w-5" />, title: "3本柱の収益", desc: "サブスク・投げ銭・物販で安定収入" },
                { icon: <Radio className="h-5 w-5" />, title: "ライブ配信収益", desc: "2SHOT・パーティーで分単位収益" },
                { icon: <Shield className="h-5 w-5" />, title: "安心・安全", desc: "AI審査・本人確認・決済保護完備" },
                { icon: <Lock className="h-5 w-5" />, title: "高単価プラン", desc: "980pt〜のプレミアムプランで差別化" },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-5 hover:shadow-md hover:shadow-pink-100 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 mb-3">
                    {f.icon}
                  </div>
                  <div className="font-bold text-gray-800 text-sm mb-1">{f.title}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2">
              <p className="text-pink-400 text-xs font-bold tracking-widest mb-4 uppercase">For Creators</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
                好きなことで、<br />本気で稼ぐ。
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8">
                サブスクリプション・ライブ配信・グッズ販売の3本柱で安定した月収を実現。月収100万円以上のトップクリエイターも多数在籍。
              </p>
              <Button onClick={onRegisterClick} className="rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold px-7 h-11" data-testid="button-creator-register">
                クリエイターとして始める <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-pink-400 text-xs font-bold tracking-widest mb-3 uppercase">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">30秒で始められる。</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "01", title: "無料登録", desc: "メールアドレスで30秒で完了" },
              { num: "02", title: "クリエイターを探す", desc: "ジャンルやランキングから選ぶ" },
              { num: "03", title: "サブスク or 購入", desc: "ポイントで限定コンテンツへ" },
              { num: "04", title: "ライブで交流", desc: "リアルタイムで特別な体験を" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="text-5xl font-black text-pink-100 leading-none mb-3">{s.num}</div>
                <div className="font-bold text-gray-800 mb-2">{s.title}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POINTS ── */}
      <section className="py-24 sm:py-32 bg-pink-50">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-pink-400 text-xs font-bold tracking-widest mb-3 uppercase">Points</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">ポイントで、自由に応援。</h2>
            <p className="text-gray-400 text-sm mt-3">1ポイント＝1円（税抜）。料金はクリエイターが自由に設定。</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: <Heart className="h-6 w-6" />,
                title: "サブスクリプション",
                desc: "クリエイターが月額料金を自由設定。継続応援でお気に入りの限定コンテンツを楽しめる。",
                tag: "月額・クリエイター設定",
                featured: false,
              },
              {
                icon: <Radio className="h-6 w-6" />,
                title: "ライブ配信",
                desc: "2SHOTやパーティーはクリエイターがレート設定。リアルタイムで特別な時間を過ごせる。",
                tag: "分単位・クリエイター設定",
                featured: true,
              },
              {
                icon: <ShoppingBag className="h-6 w-6" />,
                title: "グッズ・デジタル販売",
                desc: "物販・デジタルコンテンツの価格もクリエイターが決める。推しだけの限定品をゲット。",
                tag: "価格自由・クリエイター設定",
                featured: false,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-7 ${item.featured ? "bg-pink-500" : "bg-white border border-pink-100"}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${item.featured ? "bg-white/20 text-white" : "bg-pink-50 text-pink-500"}`}>
                  {item.icon}
                </div>
                <div className={`text-base font-black mb-2 ${item.featured ? "text-white" : "text-gray-900"}`}>{item.title}</div>
                <p className={`text-xs leading-relaxed mb-5 ${item.featured ? "text-pink-100" : "text-gray-500"}`}>{item.desc}</p>
                <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full ${item.featured ? "bg-white/20 text-white" : "bg-pink-50 text-pink-500"}`}>
                  {item.tag}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-xs text-gray-400 mt-10"
          >
            ポイントは銀行振込またはカード決済で購入できます。
          </motion.p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-2xl mx-auto px-5">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-pink-400 text-xs font-bold tracking-widest mb-3 uppercase">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">よくある質問</h2>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 sm:py-32 bg-pink-500">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            あなたの物語を、<br />Only-Uで始めよう。
          </h2>
          <p className="text-pink-100 mb-10 text-sm sm:text-base">今すぐ無料登録してクリエイターやファンと繋がろう。</p>
          <Button
            onClick={onRegisterClick}
            size="lg"
            className="rounded-full bg-white text-pink-500 hover:bg-pink-50 font-black px-10 h-12 text-base"
            data-testid="button-cta-register"
          >
            無料で始める <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-pink-100 py-12">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10 mb-10">
            <div>
              <img src={logoImage} alt="Only-U" className="w-36 h-auto object-contain mb-3" />
              <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
                クリエイターとファンをつなぐ<br />日本発のプレミアムSNSプラットフォーム。
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-xs font-bold text-pink-400 mb-4">サービス</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: "利用規約", href: "/terms" },
                    { label: "プライバシーポリシー", href: "/privacy" },
                    { label: "特定商取引法", href: "/legal" },
                    { label: "ガイドライン", href: "/guidelines" },
                  ].map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-xs text-gray-400 hover:text-pink-500 transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-pink-400 mb-4">サポート</h4>
                <ul className="space-y-2.5">
                  {[
                    { label: "ヘルプ", href: "/help" },
                    { label: "クリエイター申請", href: "/creator-application" },
                  ].map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-xs text-gray-400 hover:text-pink-500 transition-colors">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-pink-50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-gray-300 text-xs">&copy; {new Date().getFullYear()} Only-U. All rights reserved.</p>
            <p className="text-gray-300 text-xs">運営：合同会社SIN JAPAN KANAGAWA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
