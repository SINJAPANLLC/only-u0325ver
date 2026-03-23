import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "@/components/loading-screen";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import {
  Heart, Shield, Video, ShoppingBag,
  ChevronDown, ChevronRight, TrendingUp, Lock, Check,
  Radio, ArrowRight, Sparkles
} from "lucide-react";

interface LandingProps {
  onRegisterClick?: () => void;
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
  const [showSplash, setShowSplash] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
      <AnimatePresence>
        {showSplash && (
          <motion.div key="splash" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="fixed inset-0 z-[100]">
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl border-b border-pink-100" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
          <img src={logoImage} alt="Only-U" className="h-16 object-contain" />
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-28 pb-20 bg-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(252,231,243,0.7) 0%, rgba(255,255,255,0) 70%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.7 }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9 }}
            className="inline-flex items-center gap-2 bg-pink-50 border border-pink-200 text-pink-500 text-xs font-semibold px-4 py-2 rounded-full mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            日本発・クリエイター × ファン プラットフォーム
          </motion.div>

          <h1 className="font-black leading-none tracking-tight mb-6 whitespace-nowrap" style={{ fontSize: "clamp(2rem, 6.5vw, 5.5rem)" }}>
            <span className="text-gray-900">あなたの</span><span className="text-pink-500">推しと、もっと。</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            クリエイターとファンが深くつながる<br className="hidden sm:block" />
            日本のプレミアム・ファンクラブプラットフォーム。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
            <Button
              onClick={onRegisterClick}
              size="lg"
              className="w-full sm:w-auto rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold px-8 h-12 shadow-lg shadow-pink-100"
              data-testid="button-hero-register"
            >
              無料で始める <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link href="/auth?mode=login">
              <button className="text-sm font-medium text-gray-400 hover:text-pink-500 transition-colors flex items-center gap-1" data-testid="button-hero-login">
                ログインはこちら <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
            {["登録無料", "クレジットカード不要", "いつでも退会可能"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-300 inline-block" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-pink-500 py-14">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "10,000+", label: "登録クリエイター" },
              { num: "500,000+", label: "アクティブファン" },
              { num: "¥980〜", label: "月額プラン" },
              { num: "98%", label: "クリエイター満足度" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-white mb-1">{s.num}</div>
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

      {/* ── PRICING ── */}
      <section className="py-24 sm:py-32 bg-pink-50">
        <div className="max-w-5xl mx-auto px-5">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-pink-400 text-xs font-bold tracking-widest mb-3 uppercase">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">シンプルな料金設定。</h2>
            <p className="text-gray-400 text-sm mt-3">1ポイント＝1円（税抜）。使いたい分だけ購入。</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                name: "スタータープラン",
                price: "¥3,000",
                sub: "3,000pt購入",
                features: ["コンテンツ視聴", "メッセージ送信", "通常ライブ参加", "グッズ購入"],
                featured: false,
              },
              {
                name: "プレミアムプラン",
                price: "¥980〜",
                sub: "月額・クリエイター設定",
                badge: "人気No.1",
                features: ["全限定コンテンツ", "2SHOTライブ", "パーティーライブ", "優先メッセージ", "限定グッズ先行購入"],
                featured: true,
              },
              {
                name: "クリエイター",
                price: "無料",
                sub: "収益還元型",
                features: ["無制限コンテンツ投稿", "ライブ配信", "ショップ開設", "収益分析ツール", "専属サポート"],
                featured: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-3xl p-7 relative ${plan.featured ? "bg-pink-500 text-white" : "bg-white border border-pink-100"}`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-pink-500 text-[10px] font-bold px-3 py-1 rounded-full border border-pink-200">
                    {plan.badge}
                  </span>
                )}
                <div className={`text-xs font-bold mb-2 ${plan.featured ? "text-pink-100" : "text-pink-500"}`}>{plan.name}</div>
                <div className={`text-3xl font-black mb-0.5 ${plan.featured ? "text-white" : "text-gray-900"}`}>{plan.price}</div>
                <div className={`text-xs mb-7 ${plan.featured ? "text-pink-200" : "text-gray-400"}`}>{plan.sub}</div>
                <ul className="space-y-3 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm">
                      <Check className={`h-3.5 w-3.5 shrink-0 ${plan.featured ? "text-white" : "text-pink-400"}`} />
                      <span className={plan.featured ? "text-pink-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={onRegisterClick}
                  className={`w-full rounded-full font-bold h-10 text-sm ${plan.featured ? "bg-white text-pink-500 hover:bg-pink-50" : "bg-pink-500 hover:bg-pink-600 text-white"}`}
                  data-testid={`button-plan-${i}`}
                >
                  始める
                </Button>
              </motion.div>
            ))}
          </div>
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
              <img src={logoImage} alt="Only-U" className="h-16 object-contain mb-3" />
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
            <p className="text-gray-300 text-xs">運営：SIN JAPAN株式会社</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
