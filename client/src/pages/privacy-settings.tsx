import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Shield,
  UserX,
  Eye,
  Lock,
  MessageSquare,
  Save,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrivacySettings {
  showOnlineStatus: boolean;
  allowMessages: boolean;
  showActivity: boolean;
}

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  blockedAt: string;
}

const privacyItems = [
  { key: "showOnlineStatus" as keyof PrivacySettings, icon: Eye, label: "オンライン状態を表示", description: "他のユーザーにオンライン状態を見せる", gradient: "from-green-500 to-emerald-500" },
  { key: "allowMessages" as keyof PrivacySettings, icon: MessageSquare, label: "メッセージを許可", description: "フォロー外からのメッセージを受け取る", gradient: "from-blue-500 to-cyan-500" },
  { key: "showActivity" as keyof PrivacySettings, icon: Eye, label: "アクティビティを表示", description: "いいねなどのアクティビティを公開", gradient: "from-purple-500 to-pink-500" },
];

export default function PrivacySettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: settings, isLoading: isLoadingSettings } = useQuery<PrivacySettings>({
    queryKey: ["/api/privacy-settings"],
  });

  const { data: blockedUsers, isLoading: isLoadingBlocked } = useQuery<BlockedUser[]>({
    queryKey: ["/api/blocked-users"],
  });

  const [form, setForm] = useState<PrivacySettings>({
    showOnlineStatus: true,
    allowMessages: true,
    showActivity: true,
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: PrivacySettings) => {
      await apiRequest("PATCH", "/api/privacy-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/privacy-settings"] });
      toast({ title: "プライバシー設定を更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/blocked-users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-users"] });
      toast({ title: "ブロックを解除しました" });
    },
    onError: () => {
      toast({ title: "解除に失敗しました", variant: "destructive" });
    },
  });

  const isLoading = isLoadingSettings || isLoadingBlocked;

  return (
    <div className="min-h-screen bg-black text-white pb-8">
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-base">プライバシー設定</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">プライバシー</p>
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden divide-y divide-white/10">
                {privacyItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 p-4">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-white/50">{item.description}</p>
                    </div>
                    <Switch
                      checked={form[item.key]}
                      onCheckedChange={(checked) => setForm({ ...form, [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold"
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              data-testid="button-save-privacy"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              設定を保存
            </Button>

            <div>
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 px-1">ブロックしたユーザー</p>
              <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                {blockedUsers && blockedUsers.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {blockedUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-4">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={user.avatarUrl} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold">
                            {user.displayName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{user.displayName}</p>
                          <p className="text-xs text-white/50">@{user.username}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 rounded-xl text-xs border-white/20 text-white hover:bg-white/10"
                          onClick={() => unblockMutation.mutate(user.id)}
                          disabled={unblockMutation.isPending}
                          data-testid={`button-unblock-${user.id}`}
                        >
                          解除
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-2">
                      <UserX className="h-6 w-6 text-white/50" />
                    </div>
                    <p className="text-sm font-medium">ブロック中のユーザーなし</p>
                    <p className="text-xs text-white/50">ブロックしているユーザーはいません</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
