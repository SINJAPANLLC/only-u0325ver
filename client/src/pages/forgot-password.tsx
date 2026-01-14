import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { toast } = useToast();
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "メールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "エラーが発生しました");
      }

      setIsSuccess(true);
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "エラーが発生しました",
        variant: "destructive",
      });
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center p-4 border-b">
          <Link href="/auth">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold ml-2">パスワードリセット</h1>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">メールを送信しました</h2>
          <p className="text-muted-foreground text-center mb-6">
            パスワードリセットのリンクを送信しました。<br />
            メールをご確認ください。
          </p>
          <Link href="/auth">
            <Button data-testid="button-back-to-login">
              ログインに戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center p-4 border-b">
        <Link href="/auth">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold ml-2">パスワードをお忘れの方</h1>
      </header>

      <div className="flex-1 flex flex-col p-6">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">パスワードをリセット</h2>
          <p className="text-muted-foreground">
            登録したメールアドレスを入力してください。パスワードリセットのリンクをお送りします。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="メールアドレスを入力"
            className="h-12 border-gray-200 rounded-lg text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            data-testid="input-forgot-email"
          />

          {turnstileSiteKey && (
            <div className="flex justify-center">
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                onSuccess={setTurnstileToken}
                onError={() => setTurnstileToken("")}
                onExpire={() => setTurnstileToken("")}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-lg text-base font-medium"
            disabled={isLoading || (turnstileSiteKey && !turnstileToken)}
            data-testid="button-submit-forgot"
          >
            {isLoading ? "送信中..." : "リセットリンクを送信"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth">
            <button
              className="text-primary text-sm hover:underline"
              data-testid="link-back-to-login"
            >
              ログインに戻る
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
