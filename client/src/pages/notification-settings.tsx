import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Heart,
  ShoppingBag,
  Radio,
  Mail,
  Smartphone,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  messages: boolean;
  likes: boolean;
  follows: boolean;
  purchases: boolean;
  liveStreams: boolean;
  email: boolean;
  push: boolean;
}

const notificationTypes = [
  { key: "messages" as keyof NotificationSettings, icon: MessageSquare, label: "メッセージ", description: "新しいメッセージを受信した時", gradient: "from-blue-500 to-cyan-500" },
  { key: "likes" as keyof NotificationSettings, icon: Heart, label: "いいね", description: "コンテンツにいいねされた時", gradient: "from-pink-500 to-rose-500" },
  { key: "follows" as keyof NotificationSettings, icon: Bell, label: "フォロー", description: "新しいフォロワーが追加された時", gradient: "from-purple-500 to-pink-500" },
  { key: "purchases" as keyof NotificationSettings, icon: ShoppingBag, label: "購入・販売", description: "商品が購入または販売された時", gradient: "from-green-500 to-emerald-500" },
  { key: "liveStreams" as keyof NotificationSettings, icon: Radio, label: "ライブ配信", description: "フォロー中のクリエイターが配信開始した時", gradient: "from-red-500 to-orange-500" },
];

export default function NotificationSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<NotificationSettings>({
    queryKey: ["/api/notification-settings"],
  });

  const [form, setForm] = useState<NotificationSettings>({
    messages: true,
    likes: true,
    follows: true,
    purchases: true,
    liveStreams: true,
    email: true,
    push: true,
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      await apiRequest("PATCH", "/api/notification-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-settings"] });
      toast({ title: "通知設定を更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-base">通知設定</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-card border border-border/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">通知の種類</p>
              <div className="rounded-2xl bg-card border border-border/30 overflow-hidden divide-y divide-border/30">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="flex items-center gap-3 p-4">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0`}>
                      <type.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{type.description}</p>
                    </div>
                    <Switch
                      checked={form[type.key]}
                      onCheckedChange={(checked) => setForm({ ...form, [type.key]: checked })}
                      data-testid={`switch-${type.key}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">通知方法</p>
              <div className="rounded-2xl bg-card border border-border/30 overflow-hidden divide-y divide-border/30">
                <div className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">メール通知</p>
                    <p className="text-xs text-muted-foreground">重要な通知をメールで受け取る</p>
                  </div>
                  <Switch
                    checked={form.email}
                    onCheckedChange={(checked) => setForm({ ...form, email: checked })}
                    data-testid="switch-email"
                  />
                </div>
                <div className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">プッシュ通知</p>
                    <p className="text-xs text-muted-foreground">ブラウザでプッシュ通知を受け取る</p>
                  </div>
                  <Switch
                    checked={form.push}
                    onCheckedChange={(checked) => setForm({ ...form, push: checked })}
                    data-testid="switch-push"
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold"
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              設定を保存
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
