import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { BottomNavigation } from "@/components/bottom-navigation";
import logoImage from "@assets/IMG_9769_1768973936225.PNG";

interface ConversationItem {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  isVerified: boolean;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

function VerifiedBadge() {
  return (
    <svg className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function ConversationRow({
  id,
  participantName,
  participantAvatar,
  lastMessage,
  lastMessageAt,
  unreadCount,
  isVerified,
  onClick,
}: ConversationItem & { onClick: () => void }) {
  const hasUnread = unreadCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-white/10 hover:bg-white/5 transition-colors"
      data-testid={`conversation-${id}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar style={{ height: "52px", width: "52px" }}>
          <AvatarImage src={participantAvatar || undefined} className="object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-lg font-bold">
            {participantName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <div className="absolute -top-0.5 -right-0.5 h-5 min-w-5 flex items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-bold px-1 shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className={`font-semibold truncate text-sm ${hasUnread ? "text-white" : "text-white/90"}`}>
              {participantName}
            </h3>
            {isVerified && <VerifiedBadge />}
          </div>
          <span className="text-[11px] text-white/40 flex-shrink-0 ml-2">
            {formatDistanceToNow(lastMessageAt, { addSuffix: false, locale: ja })}
          </span>
        </div>
        <p className={`text-sm truncate ${hasUnread ? "font-medium text-white/80" : "text-white/40"}`}>
          {lastMessage || "メッセージを開始"}
        </p>
      </div>
    </motion.div>
  );
}

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: rawConversations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: creators } = useQuery<any[]>({
    queryKey: ["/api/creators"],
  });

  const handleConversationClick = (conversationId: string) => {
    setLocation(`/conversation/${conversationId}`);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    }, 500);
  };

  const conversations: ConversationItem[] = (rawConversations || []).map((conv) => {
    const participantId = conv.participant1Id === user?.id
      ? conv.participant2Id
      : conv.participant1Id;
    const creatorInfo = creators?.find((c: any) => c.userId === participantId);

    return {
      id: conv.id,
      participantId,
      participantName: conv.participantName || creatorInfo?.displayName || "ユーザー",
      participantAvatar: conv.participantAvatar || creatorInfo?.avatarUrl || null,
      isVerified: creatorInfo?.isVerified || false,
      lastMessage: conv.lastMessageContent || "",
      lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt || Date.now()),
      unreadCount: conv.unreadCount || 0,
    };
  });

  const filtered = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="flex items-center px-4 pt-safe h-16 flex-shrink-0 lg:hidden">
        <img src={logoImage} alt="Only-U" className="h-16 object-contain brightness-0 invert" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        <div className="sticky top-0 z-20 bg-black border-b border-white/10">
          <div className="px-4 pt-1 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="font-bold text-xl leading-tight text-white">メッセージ</h1>
                {filtered.length > 0 && (
                  <p className="text-xs text-white/40">{filtered.length}件</p>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl bg-white/8 border-0 focus-visible:ring-1 focus-visible:ring-pink-500/30 text-sm text-white placeholder:text-white/30"
                data-testid="input-search-messages"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-pink-500/50" />
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((conv, i) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ConversationRow
                  {...conv}
                  onClick={() => handleConversationClick(conv.id)}
                />
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="font-semibold mb-1.5 text-white" data-testid="text-no-messages">
                {searchQuery ? "見つかりませんでした" : "メッセージがありません"}
              </h3>
              <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                {searchQuery
                  ? "別のキーワードで検索してください"
                  : "クリエイターのプロフィールからメッセージを送ってみよう"}
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
