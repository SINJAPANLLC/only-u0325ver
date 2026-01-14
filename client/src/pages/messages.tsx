import { motion } from "framer-motion";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation, CreatorProfile, Message } from "@shared/schema";

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

function ConversationPreview({
  id,
  participantName,
  participantAvatar,
  lastMessage,
  lastMessageAt,
  unreadCount,
  isVerified,
  onClick,
}: ConversationWithDetails & { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-2xl hover-elevate cursor-pointer border border-transparent hover:border-border/50 transition-colors"
      data-testid={`conversation-${id}`}
    >
      <div className="relative">
        <Avatar className="h-14 w-14">
          <AvatarImage src={participantAvatar} />
          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-lg">
            {participantName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full bg-pink-500 text-white text-xs font-bold px-1">
            {unreadCount}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{participantName}</h3>
          {isVerified && (
            <svg 
              className="h-4 w-4 text-blue-500 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          )}
        </div>
        <p className={`text-sm truncate ${unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
          {lastMessage || "メッセージを開始"}
        </p>
      </div>

      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatDistanceToNow(lastMessageAt, { addSuffix: false, locale: ja })}
      </span>
    </motion.div>
  );
}

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: creators } = useQuery<CreatorProfile[]>({
    queryKey: ["/api/creators"],
  });

  const conversationDetails: ConversationWithDetails[] = (conversations || []).map((conv) => {
    const participantId = conv.participant1Id === user?.id 
      ? conv.participant2Id 
      : conv.participant1Id;
    const participant = creators?.find(c => c.userId === participantId);
    
    return {
      id: conv.id,
      participantId,
      participantName: participant?.displayName || "ユーザー",
      isVerified: participant?.isVerified || false,
      lastMessage: "",
      lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt || Date.now()),
      unreadCount: 0,
    };
  });

  const filteredConversations = conversationDetails.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-20 overflow-y-auto scrollbar-hide">
      <div className="h-16" />
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/50 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="メッセージを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted border-0"
            data-testid="input-search-messages"
          />
        </div>
      </div>

      <div className="p-2">
        {conversationsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-1">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ConversationPreview 
                  {...conversation} 
                  onClick={() => setLocation(`/conversation/${conversation.id}`)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2" data-testid="text-no-messages">
              {searchQuery ? "検索結果がありません" : "メッセージがありません"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
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
