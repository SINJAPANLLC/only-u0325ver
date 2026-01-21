import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Shield,
  UserX,
  Eye,
  Lock,
  Save,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    if (settings) {
      setForm(settings);
    }
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
          <h1 className="text-lg font-semibold">プライバシー設定</h1>
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
                <Shield className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">プライバシー設定</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">オンライン状態を表示</p>
                      <p className="text-xs text-muted-foreground">他のユーザーにオンライン状態を見せる</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.showOnlineStatus}
                    onCheckedChange={(checked) => setForm({ ...form, showOnlineStatus: checked })}
                    data-testid="switch-online-status"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">メッセージを許可</p>
                      <p className="text-xs text-muted-foreground">フォロー外からのメッセージを受け取る</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.allowMessages}
                    onCheckedChange={(checked) => setForm({ ...form, allowMessages: checked })}
                    data-testid="switch-allow-messages"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">アクティビティを表示</p>
                      <p className="text-xs text-muted-foreground">いいねなどのアクティビティを公開</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.showActivity}
                    onCheckedChange={(checked) => setForm({ ...form, showActivity: checked })}
                    data-testid="switch-show-activity"
                  />
                </div>
              </div>

              <Button
                className="w-full mt-4"
                onClick={() => updateMutation.mutate(form)}
                disabled={updateMutation.isPending}
                data-testid="button-save-privacy"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "保存中..." : "設定を保存"}
              </Button>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <UserX className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">ブロックしたユーザー</h2>
              </div>

              {blockedUsers && blockedUsers.length > 0 ? (
                <div className="space-y-3">
                  {blockedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unblockMutation.mutate(user.id)}
                        disabled={unblockMutation.isPending}
                        data-testid={`button-unblock-${user.id}`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        解除
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ブロックしているユーザーはいません
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
