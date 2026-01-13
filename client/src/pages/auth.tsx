import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AgeVerification } from "@/components/age-verification";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

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

  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    name: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password.length < 8) {
      toast({
        title: "パスワードは8文字以上で入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!/[a-zA-Z]/.test(registerForm.password) || !/[0-9]/.test(registerForm.password)) {
      toast({
        title: "パスワードには英字と数字を含めてください",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          confirmPassword: registerForm.password,
          name: registerForm.name,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "登録に失敗しました");
      }

      toast({
        title: "登録完了",
        description: "アカウントが作成されました",
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "登録に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      turnstileRef.current?.reset();
      setTurnstileToken("");
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
          email: loginForm.email,
          password: loginForm.password,
          turnstileToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ログインに失敗しました");
      }

      toast({
        title: "ログイン成功",
      });
      
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message || "ログインに失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      turnstileRef.current?.reset();
      setTurnstileToken("");
    }
  };

  if (showAgeVerification) {
    return <AgeVerification onVerified={handleAgeVerified} onCancel={handleAgeCancel} />;
  }

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <Link href="/">
          <button 
            className="text-gray-600 hover:text-gray-800"
            data-testid="button-close-auth"
          >
            <X className="h-6 w-6" />
          </button>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">
          {mode === "register" ? "新規登録" : "ログイン"}
        </h1>
        <div className="w-6" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm mx-auto"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={logoImage} 
              alt="Only-U" 
              className="h-24 object-contain mx-auto"
              data-testid="img-logo-auth"
            />
          </div>

          {mode === "register" ? (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                type="email"
                placeholder="メールアドレスを入力"
                className="h-12 border-gray-200 rounded-lg text-base"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
                data-testid="input-register-email"
              />

              <Input
                type="password"
                placeholder="パスワードを入力"
                className="h-12 border-gray-200 rounded-lg text-base"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                data-testid="input-register-password"
              />

              <Input
                type="text"
                placeholder="名前を入力"
                className="h-12 border-gray-200 rounded-lg text-base"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
                data-testid="input-register-name"
              />

              <p className="text-xs text-center text-gray-500 leading-relaxed pt-2">
                利用規約、プライバシーポリシー、特商法に同意の上ご登録ください<br />
                新規登録を行うことでご自身が<br />
                18歳以上であることにも同意したものとみなされます
              </p>

              <div className="flex justify-center pt-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken("")}
                  onExpire={() => setTurnstileToken("")}
                  options={{
                    theme: "light",
                    size: "normal",
                  }}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full mt-4"
                disabled={isLoading || !turnstileToken}
                data-testid="button-submit-register"
              >
                {isLoading ? "登録中..." : "新規登録"}
              </Button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">または</span>
                </div>
              </div>

              {/* X Register */}
              <a href="/api/login" className="block">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-full border-gray-300 font-bold"
                  data-testid="button-x-register"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Xで新規登録
                </Button>
              </a>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="メールアドレスを入力"
                className="h-12 border-gray-200 rounded-lg text-base"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                data-testid="input-login-email"
              />

              <Input
                type="password"
                placeholder="パスワードを入力"
                className="h-12 border-gray-200 rounded-lg text-base"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                data-testid="input-login-password"
              />

              <div className="flex justify-center pt-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken("")}
                  onExpire={() => setTurnstileToken("")}
                  options={{
                    theme: "light",
                    size: "normal",
                  }}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full mt-2"
                disabled={isLoading || !turnstileToken}
                data-testid="button-submit-login"
              >
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  className="text-sm text-pink-500 hover:text-pink-600 underline"
                  data-testid="link-forgot-password"
                >
                  パスワードをお忘れの方
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">または</span>
                </div>
              </div>

              {/* X Login */}
              <a href="/api/login" className="block">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-full border-gray-300 font-bold"
                  data-testid="button-x-login"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Xでログイン
                </Button>
              </a>
            </form>
          )}

          {/* Switch Mode */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-3">
              {mode === "register" ? "既にアカウントをお持ちの方" : "アカウントをお持ちでない方"}
            </p>
            <Button 
              variant="outline"
              className="w-full h-12 rounded-full border-pink-500 text-pink-500 hover:bg-pink-50 font-bold"
              onClick={() => mode === "register" ? setMode("login") : handleSwitchToRegister()}
              data-testid="button-switch-mode"
            >
              {mode === "register" ? "ログイン" : "新規登録"}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
