import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Play, Heart, ShoppingBag, Radio, Shield, Sparkles, Star, Zap, Crown, Lock } from "lucide-react";
import logoImage from "@assets/IMG_7372_2_1768100530058.JPG";

export default function Landing() {
  const features = [
    {
      icon: Play,
      title: "限定コンテンツ",
      description: "お気に入りのクリエイターだけの特別な動画",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Radio,
      title: "ライブ配信",
      description: "リアルタイムで繋がる特別な時間",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: ShoppingBag,
      title: "限定グッズ",
      description: "ここでしか手に入らないアイテム",
      gradient: "from-rose-500 to-orange-500",
    },
    {
      icon: Heart,
      title: "ダイレクトサポート",
      description: "クリエイターを直接応援",
      gradient: "from-pink-500 to-red-500",
    },
    {
      icon: Shield,
      title: "安全・安心",
      description: "厳格な審査と安全な決済",
      gradient: "from-blue-500 to-purple-500",
    },
    {
      icon: Sparkles,
      title: "高品質",
      description: "4K対応の美しい映像体験",
      gradient: "from-amber-500 to-pink-500",
    },
  ];

  const creators = [
    { name: "Yuki", followers: "12.5K", category: "ファッション" },
    { name: "Sakura", followers: "45K", category: "美容" },
    { name: "Miki", followers: "8.9K", category: "ライフスタイル" },
    { name: "Rina", followers: "23K", category: "メイク" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-xl border-b border-white/10 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img 
              src={logoImage} 
              alt="Only-U" 
              className="h-9 object-contain mix-blend-multiply dark:mix-blend-screen dark:brightness-150"
              data-testid="img-logo-landing"
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <ThemeToggle />
            <a href="/api/login">
              <Button 
                variant="outline" 
                className="rounded-full border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950/50" 
                data-testid="button-login-header"
              >
                ログイン
              </Button>
            </a>
          </motion.div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-pink-950/30" />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-pink-300/30 to-rose-400/30 dark:from-pink-600/20 dark:to-rose-600/20 blur-3xl"
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-300/20 to-pink-400/20 dark:from-purple-600/15 dark:to-pink-600/15 blur-3xl"
            />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20 px-5 py-2.5 text-sm font-medium text-pink-600 dark:text-pink-400 border border-pink-200/50 dark:border-pink-800/50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>日本発のクリエイタープラットフォーム</span>
                  </motion.div>
                  
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                    <span className="text-foreground">あなただけの</span>
                    <br />
                    <span className="gradient-text text-shadow">特別な繋がり</span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                    お気に入りのクリエイターと深く繋がる。
                    <br className="hidden sm:block" />
                    限定コンテンツ、ライブ配信、限定グッズを楽しもう。
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="/api/login" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full h-14 rounded-full text-base font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 border-0 shadow-xl shadow-pink-500/25 btn-glow transition-all duration-300"
                      data-testid="button-get-started"
                    >
                      <Zap className="h-5 w-5 mr-2" />
                      無料で始める
                    </Button>
                  </a>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 rounded-full text-base font-semibold border-2 border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950/30"
                    data-testid="button-learn-more"
                  >
                    詳しく見る
                  </Button>
                </div>

                <div className="flex items-center gap-8 pt-6">
                  <div className="flex -space-x-4">
                    {creators.map((creator, i) => (
                      <motion.div
                        key={creator.name}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-3 border-background flex items-center justify-center shadow-lg"
                      >
                        <span className="text-sm font-bold text-white">
                          {creator.name.charAt(0)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-lg">10,000+</p>
                    <p className="text-sm text-muted-foreground">クリエイターが活躍中</p>
                  </div>
                </div>
              </motion.div>

              {/* Hero Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative hidden lg:block"
              >
                <div className="relative">
                  {/* Phone mockup */}
                  <div className="relative mx-auto w-[280px]">
                    <div className="absolute -inset-4 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-[3rem] blur-2xl" />
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-2 shadow-2xl">
                      <div className="bg-gradient-to-br from-card to-card/90 rounded-[2rem] overflow-hidden">
                        {/* Phone screen content */}
                        <div className="aspect-[9/19] bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-pink-950/20 p-4 space-y-3">
                          {/* Mini header */}
                          <div className="flex items-center justify-between">
                            <div className="h-6 w-20 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500" />
                            <div className="h-6 w-6 rounded-full bg-pink-200 dark:bg-pink-800" />
                          </div>
                          
                          {/* Video cards */}
                          {[1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                              className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg"
                            >
                              <div className="aspect-video bg-gradient-to-br from-pink-200 to-rose-300 dark:from-pink-800 dark:to-rose-900 flex items-center justify-center">
                                <div className="h-8 w-8 rounded-full bg-white/80 flex items-center justify-center">
                                  <Play className="h-4 w-4 text-pink-500 ml-0.5" fill="currentColor" />
                                </div>
                              </div>
                              <div className="p-2 space-y-1">
                                <div className="h-2 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                                <div className="h-2 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
                              </div>
                            </motion.div>
                          ))}
                          
                          {/* Bottom nav mockup */}
                          <div className="absolute bottom-4 left-4 right-4 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-around px-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`h-5 w-5 rounded-full ${i === 1 ? 'bg-pink-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <motion.div
                    animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -left-8 top-20 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-xl border border-pink-100 dark:border-pink-900"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                        <Heart className="h-4 w-4 text-white" fill="white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">+1,234</p>
                        <p className="text-[10px] text-muted-foreground">いいね</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    animate={{ y: [10, -10, 10], rotate: [5, -5, 5] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute -right-4 bottom-32 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-xl border border-pink-100 dark:border-pink-900"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Premium</p>
                        <p className="text-[10px] text-muted-foreground">限定公開</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-50/50 to-transparent dark:via-pink-950/10" />
          
          <div className="relative max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 mb-4">
                Features
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Only-Uの<span className="gradient-text">特徴</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                クリエイターとファンを繋ぐ、新しいプラットフォーム
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="relative rounded-2xl bg-white dark:bg-gray-900 border border-pink-100/50 dark:border-pink-900/30 p-6 h-full card-hover overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-600" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full border border-white/10"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -left-1/4 h-[600px] w-[600px] rounded-full border border-white/10"
          />
          
          <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-2 text-sm font-medium">
                <Star className="h-4 w-4" fill="currentColor" />
                今すぐ無料で始められます
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-shadow-lg">
                今すぐ始めよう
              </h2>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                無料で登録して、お気に入りのクリエイターを見つけよう
              </p>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a href="/api/login">
                  <Button 
                    size="lg" 
                    className="h-16 px-12 rounded-full text-lg font-bold bg-white text-pink-600 hover:bg-white/90 shadow-2xl"
                    data-testid="button-signup-cta"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    無料で登録する
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-card/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <img 
                src={logoImage} 
                alt="Only-U" 
                className="h-8 object-contain mix-blend-multiply dark:mix-blend-screen dark:brightness-150"
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
