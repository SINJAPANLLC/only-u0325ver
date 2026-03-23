import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "メールアドレスを入力してください", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), turnstileToken: "bypass" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "エラーが発生しました");
      setIsSuccess(true);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "エラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-pink-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">メールを送信しました</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">
            パスワードリセットのリンクを送信しました。<br />
            メールをご確認ください。
          </p>
          <Link href="/auth?mode=login">
            <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full h-13" style={{ height: "52px" }} data-testid="button-back-to-login">
              ログインに戻る
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center px-5 pt-safe pt-6 pb-4">
        <Link href="/auth?mode=login">
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-pink-500 transition-colors" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">戻る</span>
          </button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <img src={logoImage} alt="Only-U" className="w-28 h-auto object-contain mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mb-5">
              <Mail className="h-7 w-7 text-pink-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">パスワードをリセット</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              登録したメールアドレスを入力してください。<br />
              パスワードリセットのリンクをお送りします。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
              <Input
                type="email"
                placeholder="メールアドレスを入力"
                className="pl-11 border-gray-200 rounded-2xl text-sm focus-visible:ring-pink-400 bg-gray-50"
                style={{ height: "52px" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-forgot-email"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full text-base shadow-lg shadow-pink-200"
              style={{ height: "52px" }}
              disabled={isLoading}
              data-testid="button-submit-forgot"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  送信中...
                </span>
              ) : "リセットリンクを送信"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth?mode=login">
              <span className="text-sm text-pink-400 hover:text-pink-600 cursor-pointer" data-testid="link-back-to-login">
                ログインに戻る
              </span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
