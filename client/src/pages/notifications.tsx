import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, Check, Loader2, MessageCircle, ShoppingBag, Heart, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Notification } from "@shared/schema";

const notificationIcons: Record<string, typeof Bell> = {
  message: MessageCircle,
  purchase: ShoppingBag,
  follow: UserPlus,
  like: Heart,
};

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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
    <div className="h-full bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => setLocation("/account")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">通知</h1>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <Check className="h-4 w-4 mr-1" />
              すべて既読
            </Button>
          )}
        </div>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground" data-testid="text-no-notifications">通知はありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell;
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    notification.isRead ? "bg-background" : "bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900"
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markReadMutation.mutate(notification.id);
                    }
                  }}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notification.isRead ? "bg-muted" : "bg-pink-500"
                  }`}>
                    <Icon className={`h-5 w-5 ${notification.isRead ? "text-muted-foreground" : "text-white"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${notification.isRead ? "" : "text-pink-600 dark:text-pink-400"}`}>
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-pink-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
