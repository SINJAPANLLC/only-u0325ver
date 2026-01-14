import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, CheckCircle, XCircle } from "lucide-react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";

  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }

    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        setIsTokenValid(data.valid);
      })
      .catch(() => {
        setIsTokenValid(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: "パスワードは8文字以上で入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast({
        title: "パスワードには英字と数字を含めてください",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "パスワードが一致しません",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
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

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isTokenValid === false) {
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
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">リンクが無効です</h2>
          <p className="text-muted-foreground text-center mb-6">
            このパスワードリセットリンクは無効か、<br />
            有効期限が切れています。
          </p>
          <Link href="/forgot-password">
            <Button data-testid="button-request-new">
              新しいリンクをリクエスト
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <h2 className="text-xl font-bold mb-2">パスワードを変更しました</h2>
          <p className="text-muted-foreground text-center mb-6">
            新しいパスワードでログインできます。
          </p>
          <Link href="/auth">
            <Button data-testid="button-go-to-login">
              ログインする
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
        <h1 className="text-lg font-semibold ml-2">新しいパスワードを設定</h1>
      </header>

      <div className="flex-1 flex flex-col p-6">
        <div className="mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">新しいパスワード</h2>
          <p className="text-muted-foreground">
            8文字以上で、英字と数字を含むパスワードを設定してください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="新しいパスワード"
            className="h-12 border-gray-200 rounded-lg text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="input-new-password"
          />

          <Input
            type="password"
            placeholder="パスワードを確認"
            className="h-12 border-gray-200 rounded-lg text-base"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            data-testid="input-confirm-password"
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
            data-testid="button-submit-reset"
          >
            {isLoading ? "変更中..." : "パスワードを変更"}
          </Button>
        </form>
      </div>
    </div>
  );
}
