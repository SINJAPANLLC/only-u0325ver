import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AgeVerification } from "@/components/age-verification";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

function getAgeVerified(): boolean {
  try {
    return localStorage.getItem("only-u-age-verified") === "true";
  } catch {
    return false;
  }
}

export default function Auth() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(() => getAgeVerified());
  const [showPassword, setShowPassword] = useState(false);

  const getInitialMode = (): "register" | "login" => {
    const params = new URLSearchParams(searchString);
    return params.get("mode") === "login" ? "login" : "register";
  };

  const [mode, setMode] = useState<"register" | "login">(getInitialMode);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const urlMode = params.get("mode");
    if (urlMode === "login") {
      setMode("login");
    } else if (urlMode === "register") {
      if (!isAgeVerified) {
        setShowAgeVerification(true);
      } else {
        setMode("register");
      }
    }
  }, [searchString, isAgeVerified]);

  const handleSwitchToRegister = () => {
    if (!isAgeVerified) {
      setShowAgeVerification(true);
    } else {
      setMode("register");
    }
  };

  const handleAgeVerified = () => {
    setIsAgeVerified(true);
    setShowAgeVerification(false);
    setMode("register");
  };

  const handleAgeCancel = () => {
    setShowAgeVerification(false);
    setMode("login");
  };

  const [registerForm, setRegisterForm] = useState({ email: "", password: "", name: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password.length < 8) {
      toast({ title: "パスワードは8文字以上で入力してください", variant: "destructive" });
      return;
    }
    if (!/[a-zA-Z]/.test(registerForm.password) || !/[0-9]/.test(registerForm.password)) {
      toast({ title: "パスワードには英字と数字を含めてください", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email.trim(),
          password: registerForm.password,
          confirmPassword: registerForm.password,
          name: registerForm.name.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "登録に失敗しました");
      toast({ title: "登録完了", description: "アカウントが作成されました" });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({ title: "エラー", description: error.message || "登録に失敗しました", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.email.trim(),
          password: loginForm.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ログインに失敗しました");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({ title: "エラー", description: error.message || "ログインに失敗しました", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (showAgeVerification) {
    return <AgeVerification onVerified={handleAgeVerified} onCancel={handleAgeCancel} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center px-5 pt-safe pt-6 pb-4">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-pink-500 transition-colors" data-testid="button-back-auth">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">戻る</span>
          </button>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-6 pb-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 mt-2"
        >
          <img src={logoImage} alt="Only-U" className="w-32 h-auto object-contain mx-auto" data-testid="img-logo-auth" />
        </motion.div>

        {/* Tab switcher */}
        <div className="w-full max-w-sm mb-8">
          <div className="relative flex bg-muted rounded-2xl p-1">
            <motion.div
              className="absolute inset-y-1 rounded-xl bg-background shadow-sm"
              animate={{ left: mode === "register" ? "4px" : "50%", right: mode === "register" ? "50%" : "4px" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
            <button
              className={`relative flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors z-10 ${mode === "register" ? "text-pink-500" : "text-gray-400"}`}
              onClick={handleSwitchToRegister}
              data-testid="button-tab-register"
            >
              新規登録
            </button>
            <button
              className={`relative flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors z-10 ${mode === "login" ? "text-pink-500" : "text-gray-400"}`}
              onClick={() => setMode("login")}
              data-testid="button-tab-login"
            >
              ログイン
            </button>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "register" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === "register" ? 20 : -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm"
          >
            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="ニックネームを入力"
                    className="h-13 pl-11 border-border rounded-2xl text-sm focus-visible:ring-pink-400 bg-muted/50"
                    style={{ height: "52px" }}
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                    data-testid="input-register-name"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="メールアドレスを入力"
                    className="h-13 pl-11 border-border rounded-2xl text-sm focus-visible:ring-pink-400 bg-muted/50"
                    style={{ height: "52px" }}
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                    data-testid="input-register-email"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワード（英数字8文字以上）"
                    className="h-13 pl-11 pr-11 border-border rounded-2xl text-sm focus-visible:ring-pink-400 bg-muted/50"
                    style={{ height: "52px" }}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    data-testid="input-register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <p className="text-[11px] text-center text-gray-400 leading-relaxed pt-1">
                  <Link href="/terms"><span className="text-pink-400 underline cursor-pointer">利用規約</span></Link>・
                  <Link href="/privacy"><span className="text-pink-400 underline cursor-pointer">プライバシーポリシー</span></Link>・
                  <Link href="/legal"><span className="text-pink-400 underline cursor-pointer">特商法</span></Link>に同意の上ご登録ください。
                  <br />新規登録により18歳以上であることに同意したものとみなされます。
                </p>

                <Button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full h-13 text-base shadow-lg shadow-pink-200 mt-2"
                  style={{ height: "52px" }}
                  disabled={isLoading}
                  data-testid="button-submit-register"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      登録中...
                    </span>
                  ) : "新規登録"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="メールアドレスを入力"
                    className="h-13 pl-11 border-border rounded-2xl text-sm focus-visible:ring-pink-400 bg-muted/50"
                    style={{ height: "52px" }}
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    data-testid="input-login-email"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="パスワードを入力"
                    className="h-13 pl-11 pr-11 border-border rounded-2xl text-sm focus-visible:ring-pink-400 bg-muted/50"
                    style={{ height: "52px" }}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                    data-testid="input-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="text-right">
                  <Link href="/forgot-password">
                    <span className="text-xs text-pink-400 hover:text-pink-600 cursor-pointer" data-testid="link-forgot-password">
                      パスワードをお忘れの方
                    </span>
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full h-13 text-base shadow-lg shadow-pink-200"
                  style={{ height: "52px" }}
                  disabled={isLoading}
                  data-testid="button-submit-login"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      ログイン中...
                    </span>
                  ) : "ログイン"}
                </Button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Decorative bottom */}
        <div className="mt-auto pt-12 text-center">
          <p className="text-[11px] text-gray-300">Only-U &copy; {new Date().getFullYear()} 合同会社SIN JAPAN KANAGAWA</p>
        </div>
      </div>
    </div>
  );
}
