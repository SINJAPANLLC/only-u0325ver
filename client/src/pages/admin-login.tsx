import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/IMG_9769_1768973936225.PNG";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: authStatus, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/auth/me");
      return res.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/auth/login", data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "ログイン成功" });
      window.location.href = "/admin/dashboard";
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (authStatus?.authenticated) {
      setLocation("/admin/dashboard");
    }
  }, [authStatus?.authenticated, setLocation]);

  if (isCheckingAuth || authStatus?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080810]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080810] p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-rose-500/[0.03] rounded-full blur-2xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <img src={logoImage} alt="Only-U" className="h-14 w-14 object-contain rounded-2xl" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Shield className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">Only-U Admin</h1>
            <p className="text-xs text-white/40 mt-1">管理コンソール</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">メールアドレス</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-pink-500/50 focus:bg-white/[0.06] h-11 rounded-xl"
                data-testid="input-admin-email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50">パスワード</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-pink-500/50 focus:bg-white/[0.06] h-11 rounded-xl pr-10"
                  data-testid="input-admin-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              ログイン
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Only-U 管理パネル © 2024
        </p>
      </div>
    </div>
  );
}
