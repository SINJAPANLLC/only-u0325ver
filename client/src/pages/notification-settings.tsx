import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Bell,
  MessageSquare,
  Heart,
  ShoppingBag,
  Radio,
  Mail,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
    if (settings) {
      setForm(settings);
    }
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

  const notificationTypes = [
    { key: "messages" as keyof NotificationSettings, icon: MessageSquare, label: "メッセージ", description: "新しいメッセージを受信した時" },
    { key: "likes" as keyof NotificationSettings, icon: Heart, label: "いいね", description: "コンテンツにいいねされた時" },
    { key: "follows" as keyof NotificationSettings, icon: Bell, label: "フォロー", description: "新しいフォロワーが追加された時" },
    { key: "purchases" as keyof NotificationSettings, icon: ShoppingBag, label: "購入・販売", description: "商品が購入または販売された時" },
    { key: "liveStreams" as keyof NotificationSettings, icon: Radio, label: "ライブ配信", description: "フォロー中のクリエイターが配信開始した時" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">通知設定</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">通知の種類</h2>
              </div>

              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <type.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={form[type.key]}
                      onCheckedChange={(checked) => setForm({ ...form, [type.key]: checked })}
                      data-testid={`switch-${type.key}`}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">通知方法</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">メール通知</p>
                    <p className="text-xs text-muted-foreground">重要な通知をメールで受け取る</p>
                  </div>
                  <Switch
                    checked={form.email}
                    onCheckedChange={(checked) => setForm({ ...form, email: checked })}
                    data-testid="switch-email"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">プッシュ通知</p>
                    <p className="text-xs text-muted-foreground">ブラウザでプッシュ通知を受け取る</p>
                  </div>
                  <Switch
                    checked={form.push}
                    onCheckedChange={(checked) => setForm({ ...form, push: checked })}
                    data-testid="switch-push"
                  />
                </div>
              </div>
            </Card>

            <Button
              className="w-full"
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "保存中..." : "設定を保存"}
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
