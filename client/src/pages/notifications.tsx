import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, CheckCheck, Loader2, MessageCircle, ShoppingBag, Heart, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Notification } from "@shared/schema";

const notificationConfig: Record<string, { icon: typeof Bell; gradient: string; label: string }> = {
  message: { icon: MessageCircle, gradient: "from-blue-500 to-cyan-500", label: "メッセージ" },
  purchase: { icon: ShoppingBag, gradient: "from-green-500 to-emerald-500", label: "購入" },
  follow: { icon: UserPlus, gradient: "from-purple-500 to-pink-500", label: "フォロー" },
  like: { icon: Heart, gradient: "from-pink-500 to-rose-500", label: "いいね" },
};

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-xl"
              onClick={() => setLocation("/account")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base leading-tight">通知</h1>
              {unreadCount > 0 && (
                <p className="text-[11px] text-pink-500 font-medium leading-tight">{unreadCount}件の未読</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 rounded-xl text-xs text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/20"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
              )}
              全て既読
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/30 animate-pulse">
                <div className="h-12 w-12 rounded-2xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-lg w-full" />
                  <div className="h-3 bg-muted rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-5">
              <Bell className="h-10 w-10 text-pink-400" />
            </div>
            <h3 className="font-bold text-lg mb-2" data-testid="text-no-notifications">通知はありません</h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              フォロー中のクリエイターから通知が届くとここに表示されます
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notification, index) => {
                const config = notificationConfig[notification.type] || { icon: Bell, gradient: "from-gray-400 to-gray-500", label: "通知" };
                const Icon = config.icon;
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => {
                      if (!notification.isRead) markReadMutation.mutate(notification.id);
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${
                      notification.isRead
                        ? "bg-card border-border/30"
                        : "bg-pink-50/60 dark:bg-pink-950/10 border-pink-200/60 dark:border-pink-900/40"
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold text-sm leading-tight ${notification.isRead ? "text-foreground" : "text-foreground"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-pink-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                      {notification.body && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notification.body}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                        {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
