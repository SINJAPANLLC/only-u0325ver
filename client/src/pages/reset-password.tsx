import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => setIsTokenValid(data.valid))
      .catch(() => setIsTokenValid(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({ title: "パスワードは8文字以上で入力してください", variant: "destructive" });
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast({ title: "パスワードには英字と数字を含めてください", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "パスワードが一致しません", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col">
        <div className="p-4">
          <button onClick={() => setLocation("/forgot-password")} className="p-2 rounded-full hover:bg-pink-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">リンクが無効です</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            このリンクは無効か、有効期限が切れています。<br />
            もう一度リクエストしてください。
          </p>
          <Link href="/forgot-password">
            <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-8" data-testid="button-request-new">
              新しいリンクをリクエスト
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col">
        <div className="p-4">
          <Link href="/auth">
            <button className="p-2 rounded-full hover:bg-pink-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">パスワードを変更しました</h2>
          <p className="text-gray-500 mb-6">新しいパスワードでログインできます。</p>
          <Link href="/auth">
            <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-8" data-testid="button-go-to-login">
              ログインする
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col">
      <div className="p-4">
        <Link href="/auth">
          <button className="p-2 rounded-full hover:bg-pink-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center mb-4">
              <Lock className="h-7 w-7 text-pink-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">新しいパスワード</h1>
            <p className="text-gray-500 text-sm mt-2 text-center">
              8文字以上・英字と数字を含めてください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="新しいパスワード"
                className="h-12 pr-12 border-gray-200 rounded-2xl bg-white text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="パスワードを確認"
                className="h-12 pr-12 border-gray-200 rounded-2xl bg-white text-base"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-2xl text-base font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md"
              disabled={isLoading}
              data-testid="button-submit-reset"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  変更中...
                </span>
              ) : "パスワードを変更"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
