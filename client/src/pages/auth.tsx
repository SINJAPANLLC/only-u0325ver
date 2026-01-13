import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
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

              <Button 
                type="submit" 
                className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full mt-4"
                disabled={isLoading}
                data-testid="button-submit-register"
              >
                {isLoading ? "登録中..." : "新規登録"}
              </Button>
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

              <Button 
                type="submit" 
                className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full mt-2"
                disabled={isLoading}
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
