import { motion } from "framer-motion";
import { MessageCircle, Search, Loader2, PenSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import type { Conversation, CreatorProfile } from "@shared/schema";

interface ConversationWithUnread extends Conversation {
  unreadCount: number;
  lastMessageContent: string;
  participantName: string;
  participantAvatar: string | null;
}

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/lingerie_bed_3.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/bunny_girl_5.jpg";
import logoImage from "@assets/IMG_9769_1768973936225.PNG";

interface ConversationWithDetails {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isVerified?: boolean;
}

function VerifiedBadge() {
  return (
    <svg className="h-3.5 w-3.5 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function ConversationItem({
  id,
  participantName,
  participantAvatar,
  lastMessage,
  lastMessageAt,
  unreadCount,
  isVerified,
  onClick,
}: ConversationWithDetails & { onClick: () => void }) {
  const hasUnread = unreadCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-accent/60 hover:bg-accent/30 transition-colors"
      data-testid={`conversation-${id}`}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-13 w-13" style={{ height: "52px", width: "52px" }}>
          <AvatarImage src={participantAvatar || logoImage} className="object-cover" />
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
            <h3 className={`font-semibold truncate text-sm ${hasUnread ? "text-foreground" : "text-foreground/90"}`}>
              {participantName}
            </h3>
            {isVerified && <VerifiedBadge />}
          </div>
          <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
            {formatDistanceToNow(lastMessageAt, { addSuffix: false, locale: ja })}
          </span>
        </div>
        <p className={`text-sm truncate ${hasUnread ? "font-medium text-foreground/80" : "text-muted-foreground"}`}>
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

  const { data: conversations, isLoading: conversationsLoading } = useQuery<ConversationWithUnread[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: creators } = useQuery<CreatorProfile[]>({
    queryKey: ["/api/creators"],
  });

  const handleConversationClick = (conversationId: string) => {
    setLocation(`/conversation/${conversationId}`);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    }, 500);
  };

  const conversationDetails: ConversationWithDetails[] = (conversations || []).map((conv) => {
    const participantId = conv.participant1Id === user?.id
      ? conv.participant2Id
      : conv.participant1Id;
    const creatorInfo = creators?.find(c => c.userId === participantId);

    return {
      id: conv.id,
      participantId,
      participantName: conv.participantName || creatorInfo?.displayName || "ユーザー",
      participantAvatar: conv.participantAvatar || creatorInfo?.avatarUrl || undefined,
      isVerified: creatorInfo?.isVerified || false,
      lastMessage: conv.lastMessageContent || "",
      lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt || Date.now()),
      unreadCount: conv.unreadCount || 0,
    };
  });

  const demoConversations: ConversationWithDetails[] = [
    { id: "demo-1", participantId: "demo-user-1", participantName: "れいな💋", participantAvatar: img1, lastMessage: "今夜の配信楽しみにしててね💕", lastMessageAt: new Date(Date.now() - 1000 * 60 * 5), unreadCount: 3, isVerified: true },
    { id: "demo-2", participantId: "demo-user-2", participantName: "ゆあ🌙", participantAvatar: img2, lastMessage: "写真集見てくれた？感想聞かせて♡", lastMessageAt: new Date(Date.now() - 1000 * 60 * 30), unreadCount: 1, isVerified: true },
    { id: "demo-3", participantId: "demo-user-3", participantName: "みお", participantAvatar: img3, lastMessage: "ありがとう！嬉しい😊", lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2), unreadCount: 0, isVerified: false },
    { id: "demo-4", participantId: "demo-user-4", participantName: "さき💜", participantAvatar: img4, lastMessage: "2ショットでお話しよう？", lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 5), unreadCount: 2, isVerified: true },
    { id: "demo-5", participantId: "demo-user-5", participantName: "ひな🐰", participantAvatar: img5, lastMessage: "新しいコスプレ写真撮ったよ！", lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24), unreadCount: 0, isVerified: true },
  ];

  const displayConversations = conversationDetails.length > 0 ? conversationDetails : demoConversations;

  const filteredConversations = displayConversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-20 lg:pb-4 overflow-y-auto scrollbar-hide">
      <div className="h-14 lg:h-0" />

      {/* Title + Search bar */}
      <div className="sticky top-14 lg:top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h1 className="font-bold text-xl leading-tight">メッセージ</h1>
              {filteredConversations.length > 0 && (
                <p className="text-xs text-muted-foreground">{filteredConversations.length}件の会話</p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="メッセージを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-pink-500/30 text-sm"
              data-testid="input-search-messages"
            />
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <div className="divide-y divide-border/30">
        {conversationsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-pink-500/60" />
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation, index) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <ConversationItem
                {...conversation}
                onClick={() => handleConversationClick(conversation.id)}
              />
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="h-16 w-16 rounded-2xl bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-pink-400" />
            </div>
            <h3 className="font-semibold mb-1.5" data-testid="text-no-messages">
              {searchQuery ? "見つかりませんでした" : "メッセージがありません"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {searchQuery
                ? "別のキーワードで検索してください"
                : "クリエイターのプロフィールからメッセージを送ってみよう"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
