import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "パスワードが一致しません",
        variant: "destructive",
      });
      return;
    }

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
          confirmPassword: registerForm.confirmPassword,
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

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            data-testid="button-back-auth"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={logoImage} 
              alt="Only-U" 
              className="h-12 object-contain mx-auto mb-4"
            />
            <p className="text-gray-500 text-sm">
              あなただけの特別な繋がりを
            </p>
          </div>

          {/* Auth Tabs */}
          <Tabs defaultValue="register" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="register" data-testid="tab-register">新規登録</TabsTrigger>
              <TabsTrigger value="login" data-testid="tab-login">ログイン</TabsTrigger>
            </TabsList>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">お名前</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="山田 太郎"
                      className="pl-10"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                      data-testid="input-register-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="example@email.com"
                      className="pl-10"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                      data-testid="input-register-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">パスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="8文字以上（英字・数字を含む）"
                      className="pl-10 pr-10"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                      data-testid="input-register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      data-testid="button-toggle-password-register"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">パスワード（確認）</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="もう一度入力"
                      className="pl-10"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      required
                      data-testid="input-register-confirm-password"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full"
                  disabled={isLoading}
                  data-testid="button-submit-register"
                >
                  {isLoading ? "登録中..." : "無料で登録する"}
                </Button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  登録することで、<a href="/terms" className="text-pink-500 underline">利用規約</a>と
                  <a href="/privacy" className="text-pink-500 underline">プライバシーポリシー</a>に同意したものとみなされます。
                </p>
              </form>
            </TabsContent>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="example@email.com"
                      className="pl-10"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">パスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="パスワードを入力"
                      className="pl-10 pr-10"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      data-testid="input-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      data-testid="button-toggle-password-login"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <a href="#" className="text-sm text-pink-500 hover:underline">
                    パスワードを忘れた方
                  </a>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full"
                  disabled={isLoading}
                  data-testid="button-submit-login"
                >
                  {isLoading ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">または</span>
            </div>
          </div>

          {/* Social Login */}
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-full border-gray-300"
            onClick={() => {
              toast({
                title: "準備中",
                description: "Xログインは近日公開予定です",
              });
            }}
            data-testid="button-x-login"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Xでログイン
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
