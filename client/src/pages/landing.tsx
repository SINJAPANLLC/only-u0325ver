import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "@/components/loading-screen";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import {
  Heart, Shield, MessageCircle, Video, ShoppingBag,
  ChevronDown, ChevronRight, TrendingUp, Lock, Check,
  Radio
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
        className="w-full flex items-center justify-between py-5 text-left"
      >
        <span className="font-semibold text-gray-800 pr-4">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-pink-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-600 text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Landing({ onRegisterClick }: LandingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const fanFeatures = [
    {
      icon: <Video className="h-6 w-6" />,
      title: "独占コンテンツを視聴",
      desc: "お気に入りのクリエイターの限定写真・動画を楽しめます。",
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "ライブ配信でリアルタイム交流",
      desc: "2SHOTやパーティー機能でクリエイターと直接つながれます。",
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "限定グッズ・デジタル購入",
      desc: "ここでしか買えない限定商品やデジタルコンテンツを購入できます。",
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "サブスクで継続応援",
      desc: "月額プランでお気に入りのクリエイターを継続的にサポートできます。",
    },
  ];

  const creatorFeatures = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "安定した収益を構築",
      desc: "サブスクリプション・投げ銭・物販の3つの収益軸で安定した月収を実現。",
    },
    {
      icon: <Radio className="h-6 w-6" />,
      title: "ライブ配信で稼ぐ",
      desc: "2SHOTやパーティーモードでポイントを獲得。1分単位でリアルタイム収益。",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "安心・安全なプラットフォーム",
      desc: "AIコンテンツ審査・本人確認・決済保護で安全に活動できます。",
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "高品質プランで差をつける",
      desc: "980pt/月のプレミアムプランで月収100万円以上の実績クリエイターも。",
    },
  ];

  const steps = [
    { num: "01", title: "無料登録", desc: "メールアドレスとパスワードで30秒登録完了" },
    { num: "02", title: "クリエイターを探す", desc: "ジャンルやランキングからお気に入りを見つける" },
    { num: "03", title: "サブスクまたは購入", desc: "ポイントを使って限定コンテンツにアクセス" },
    { num: "04", title: "ライブ交流", desc: "配信やメッセージでクリエイターと直接つながる" },
  ];

  const faqs = [
    {
      question: "Only-Uはどんなサービスですか？",
      answer: "Only-Uは、クリエイターとファンをつなぐ日本発のプライベートSNSプラットフォームです。クリエイターは写真・動画・ライブ配信・グッズ販売を通じて収益化でき、ファンはお気に入りのクリエイターの限定コンテンツを楽しめます。",
    },
    {
      question: "登録は無料ですか？",
      answer: "はい、ユーザー登録は完全無料です。登録後はポイントを購入してクリエイターのコンテンツにアクセスできます。一部の無料コンテンツは購入なしでも閲覧できます。",
    },
    {
      question: "ポイントの仕組みを教えてください",
      answer: "1ポイント＝1円（税抜）換算です。銀行振込またはカード決済でポイントを購入し、サブスクリプション・コンテンツ購入・投げ銭・ライブ配信などに使用できます。",
    },
    {
      question: "クリエイターになるにはどうすれば良いですか？",
      answer: "ユーザー登録後、クリエイター申請フォームから申請できます。審査通過後すぐにコンテンツ投稿・ライブ配信・ショップ開設ができます。収益は月末締め翌月払いで振込されます。",
    },
    {
      question: "プライバシーは保護されますか？",
      answer: "はい。全コンテンツはアクセス制限付きで公開されます。個人情報は厳重に管理し、クリエイターの身元情報はファンには開示されません。また、AIによる不正コンテンツの自動審査も実施しています。",
    },
    {
      question: "退会・解約はいつでもできますか？",
      answer: "サブスクリプションはいつでも次回更新停止が可能です。アカウント退会も設定から随時申請できます。ポイントの残高は退会時に失効します。",
    },
  ];

  return (
    <div className="min-h-screen bg-white" ref={containerRef} style={{ overscrollBehavior: "none" }}>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100]"
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HEADER ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src={logoImage} alt="Only-U" className="h-10 object-contain" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={onRegisterClick}
              className="rounded-full text-xs sm:text-sm font-bold bg-pink-500 hover:bg-pink-600 text-white px-4 sm:px-6 h-9"
              data-testid="button-header-register"
            >
              無料登録
            </Button>
            <Link href="/auth?mode=login">
              <Button
                variant="outline"
                className="rounded-full text-xs sm:text-sm font-bold border-pink-300 text-pink-500 hover:bg-pink-50 px-4 sm:px-6 h-9"
                data-testid="button-header-login"
              >
                ログイン
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-16">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-pink-50 via-white to-rose-50 opacity-80" />
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-200/30 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-rose-200/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.7 }}
          >
            <span className="inline-block bg-pink-100 text-pink-600 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wider">
              日本発・クリエイター × ファン プラットフォーム
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight mb-6">
              クリエイターと、
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
                もっと近く。
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Only-Uは、あなたの「好き」をとことん表現できる場所。
              <br className="hidden sm:block" />
              クリエイターはここで稼ぎ、ファンはここで輝く推しと出会う。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
              <Button
                onClick={onRegisterClick}
                size="lg"
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold px-10 py-4 h-14 text-base shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all"
                data-testid="button-hero-register"
              >
                無料で始める <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
              <Link href="/auth?mode=login">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto rounded-full text-gray-600 hover:text-pink-500 hover:bg-pink-50 font-medium px-8 h-14 text-base"
                  data-testid="button-hero-login"
                >
                  ログインはこちら
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-400">
              {["登録無料", "クレジットカード不要", "すぐに利用開始"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-pink-400" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-1 text-pink-300">
            <span className="text-xs tracking-[0.2em]">SCROLL</span>
            <div className="w-px h-8 bg-gradient-to-b from-pink-300 to-transparent" />
          </div>
        </motion.div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-pink-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { num: "10,000+", label: "登録クリエイター" },
              { num: "500,000+", label: "アクティブファン" },
              { num: "¥980", label: "プレミアム最安プラン/月" },
              { num: "98%", label: "クリエイター満足度" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-pink-500 mb-1">{stat.num}</div>
                <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOR FANS ===== */}
      <section className="py-20 sm:py-28 bg-pink-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-pink-100 text-pink-500 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider">
              FOR FANS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4">
              推しを、もっと感じる。
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              お気に入りのクリエイターの限定コンテンツ、ライブ配信、グッズがここに全部揃う。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fanFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-pink-50"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-500 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              onClick={onRegisterClick}
              className="rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold px-8 h-12"
              data-testid="button-fan-register"
            >
              ファンとして登録する
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOR CREATORS ===== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-rose-100 text-rose-500 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider">
              FOR CREATORS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4">
              好きなことで、稼ぐ。
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
              Only-Uなら、サブスク・ライブ・物販の3本柱で安定した収益を実現。
              月収100万円以上の実績クリエイターも多数。
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {creatorFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 hover:shadow-md transition-shadow border border-pink-100"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-pink-500 shadow-sm mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              onClick={onRegisterClick}
              className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white font-bold px-8 h-12 shadow-md shadow-pink-200"
              data-testid="button-creator-register"
            >
              クリエイターとして始める
            </Button>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 sm:py-28 bg-pink-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-pink-100 text-pink-500 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider">
              HOW IT WORKS
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4">
              たった4ステップで始まる。
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-pink-200 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 border border-pink-100">
                  <span className="text-xl font-black text-pink-400">{s.num}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-pink-100 text-pink-500 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider">
              PRICING
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-4">
              シンプルな料金設定。
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">1ポイント＝1円（税抜）。使いたい分だけ購入できます。</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: "スタータープラン",
                price: "¥3,000",
                unit: "3,000pt",
                features: ["コンテンツ視聴", "メッセージ送信", "通常ライブ参加", "グッズ購入"],
                highlight: false,
              },
              {
                name: "プレミアムプラン",
                price: "¥980",
                unit: "/月〜",
                badge: "人気No.1",
                features: ["全限定コンテンツ視聴", "2SHOTライブ", "パーティーライブ", "優先メッセージ", "限定グッズ先行購入"],
                highlight: true,
              },
              {
                name: "クリエイタープラン",
                price: "無料",
                unit: "収益の一部還元",
                features: ["コンテンツ無制限投稿", "ライブ配信", "ショップ開設", "分析ツール", "専属サポート"],
                highlight: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-7 relative ${
                  plan.highlight
                    ? "bg-gradient-to-b from-pink-500 to-rose-400 text-white shadow-xl shadow-pink-200"
                    : "bg-white border border-pink-100 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-pink-500 text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                )}
                <div className={`text-sm font-bold mb-1 ${plan.highlight ? "text-pink-100" : "text-pink-400"}`}>
                  {plan.name}
                </div>
                <div className={`text-3xl font-black mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  {plan.price}
                </div>
                <div className={`text-xs mb-6 ${plan.highlight ? "text-pink-200" : "text-gray-400"}`}>{plan.unit}</div>
                <ul className="space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-pink-200" : "text-pink-400"}`} />
                      <span className={plan.highlight ? "text-white/90" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={onRegisterClick}
                  className={`w-full mt-7 rounded-full font-bold h-11 ${
                    plan.highlight
                      ? "bg-white text-pink-500 hover:bg-pink-50"
                      : "bg-pink-500 hover:bg-pink-600 text-white"
                  }`}
                  data-testid={`button-plan-${i}`}
                >
                  始める
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 sm:py-28 bg-pink-50">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-pink-100 text-pink-500 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider">
              FAQ
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">
              よくある質問
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm"
          >
            {faqs.map((faq, i) => (
              <FaqItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-pink-500 to-rose-400 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-rose-600/20 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              あなたの物語を、
              <br />
              Only-Uで始めよう。
            </h2>
            <p className="text-white/80 mb-10 text-base sm:text-lg">
              今すぐ無料登録してクリエイターやファンと繋がろう。
            </p>
            <Button
              onClick={onRegisterClick}
              size="lg"
              className="rounded-full bg-white text-pink-500 hover:bg-pink-50 font-black px-12 h-14 text-base shadow-xl hover:shadow-2xl transition-all"
              data-testid="button-cta-register"
            >
              無料で始める <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div>
              <img src={logoImage} alt="Only-U" className="h-10 object-contain brightness-0 invert mb-4" />
              <p className="text-gray-400 text-sm leading-relaxed">
                クリエイターとファンをつなぐ日本発のプライベートSNSプラットフォーム。
              </p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-pink-400">サービス</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {[
                  { label: "利用規約", href: "/terms" },
                  { label: "プライバシーポリシー", href: "/privacy" },
                  { label: "特定商取引法に基づく表記", href: "/legal" },
                  { label: "コンテンツガイドライン", href: "/guidelines" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-pink-400 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-pink-400">サポート</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {[
                  { label: "ヘルプセンター", href: "/help" },
                  { label: "クリエイター申請", href: "/creator-application" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-pink-400 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Only-U. All rights reserved. 運営：SIN JAPAN株式会社
          </div>
        </div>
      </footer>
    </div>
  );
}
