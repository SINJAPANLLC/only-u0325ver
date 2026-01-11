import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Play, Heart, ShoppingBag, Radio, Shield, Sparkles } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Play,
      title: "限定コンテンツ",
      description: "お気に入りのクリエイターの特別な動画を楽しもう",
    },
    {
      icon: Radio,
      title: "ライブ配信",
      description: "リアルタイムでクリエイターと繋がる",
    },
    {
      icon: ShoppingBag,
      title: "限定グッズ",
      description: "ここでしか手に入らないアイテム",
    },
    {
      icon: Heart,
      title: "ダイレクトサポート",
      description: "クリエイターを直接応援",
    },
    {
      icon: Shield,
      title: "安全・安心",
      description: "厳格な審査と安全な決済",
    },
    {
      icon: Sparkles,
      title: "高品質",
      description: "4K対応の美しい映像体験",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center shadow-md">
              <span className="text-xl font-bold text-white">U</span>
            </div>
            <span className="text-xl font-bold gradient-text">Only-U</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/api/login">
              <Button variant="outline" className="rounded-xl" data-testid="button-login-header">
                ログイン
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-pink-400/5" />
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-pink-400/10 blur-3xl" />
          
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                  >
                    <Sparkles className="h-4 w-4" />
                    新しいクリエイター体験
                  </motion.div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    あなただけの
                    <br />
                    <span className="gradient-text">特別な繋がり</span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                    お気に入りのクリエイターと深く繋がる。
                    限定コンテンツ、ライブ配信、限定グッズを楽しもう。
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="/api/login" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full h-14 rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                      data-testid="button-get-started"
                    >
                      無料で始める
                    </Button>
                  </a>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 rounded-xl text-base font-semibold"
                    data-testid="button-learn-more"
                  >
                    詳しく見る
                  </Button>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-pink-400/20 border-2 border-background flex items-center justify-center"
                      >
                        <span className="text-xs font-medium text-muted-foreground">
                          {String.fromCharCode(64 + i)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold">10,000+</p>
                    <p className="text-sm text-muted-foreground">クリエイターが活躍中</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative hidden lg:block"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-pink-400/20 rounded-3xl blur-2xl" />
                  <div className="relative bg-gradient-to-br from-card to-card/80 rounded-3xl p-6 border border-card-border shadow-2xl">
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="aspect-[9/16] rounded-2xl bg-gradient-to-br from-primary/10 to-pink-400/10 flex items-center justify-center overflow-hidden"
                        >
                          <div className="text-center">
                            <Play className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                            <span className="text-xs text-muted-foreground">動画 {i}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative rounded-2xl bg-card border border-card-border p-6 hover-elevate"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-pink-400/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold">
                今すぐ<span className="gradient-text">始めよう</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                無料で登録して、お気に入りのクリエイターを見つけよう
              </p>
              <a href="/api/login">
                <Button 
                  size="lg" 
                  className="h-14 px-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                  data-testid="button-signup-cta"
                >
                  無料で登録する
                </Button>
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-pink-400 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">U</span>
                </div>
                <span className="font-bold gradient-text">Only-U</span>
              </div>
              <p className="text-sm text-muted-foreground">
                クリエイターと繋がる、新しいプラットフォーム
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">機能紹介</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">料金プラン</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">クリエイター向け</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">お問い合わせ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">よくある質問</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">法的情報</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/terms" className="hover:text-foreground transition-colors">利用規約</a></li>
                <li><a href="/privacy" className="hover:text-foreground transition-colors">プライバシーポリシー</a></li>
                <li><a href="/legal" className="hover:text-foreground transition-colors">特定商取引法に基づく表記</a></li>
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
