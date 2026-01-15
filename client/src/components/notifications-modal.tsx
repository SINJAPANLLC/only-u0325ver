import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Check, Loader2, MessageCircle, ShoppingBag, Heart, UserPlus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Notification } from "@shared/schema";

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons: Record<string, typeof Bell> = {
  message: MessageCircle,
  purchase: ShoppingBag,
  follow: UserPlus,
  like: Heart,
};

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user && open,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold">{t("notification.title")}</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-pink-500 hover:text-pink-600"
                data-testid="button-mark-all-read"
              >
                <Check className="h-4 w-4 mr-1" />
                {t("notification.markAllRead")}
              </Button>
            )}
            <button 
              onClick={() => onOpenChange(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
              data-testid="button-close-notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500" data-testid="text-no-notifications">
                {t("notification.empty")}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                      notification.isRead 
                        ? "hover:bg-gray-50 dark:hover:bg-gray-800" 
                        : "bg-pink-50 dark:bg-pink-950/20"
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markReadMutation.mutate(notification.id);
                      }
                    }}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.isRead ? "bg-gray-100 dark:bg-gray-800" : "bg-pink-500"
                    }`}>
                      <Icon className={`h-5 w-5 ${notification.isRead ? "text-gray-400" : "text-white"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${notification.isRead ? "text-gray-700 dark:text-gray-300" : "text-pink-600 dark:text-pink-400"}`}>
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="text-sm text-gray-500 line-clamp-2">{notification.body}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
