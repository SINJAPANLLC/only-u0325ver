import { motion } from "framer-motion";
import { MessageCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface ConversationPreviewProps {
  id: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isVerified?: boolean;
}

function ConversationPreview({
  participantName,
  participantAvatar,
  lastMessage,
  lastMessageAt,
  unreadCount,
  isVerified,
}: ConversationPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-4 rounded-2xl hover-elevate cursor-pointer border border-transparent hover:border-border/50 transition-colors"
    >
      <div className="relative">
        <Avatar className="h-14 w-14">
          <AvatarImage src={participantAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg">
            {participantName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
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
          {lastMessage}
        </p>
      </div>

      <span className="text-xs text-muted-foreground flex-shrink-0">
        {formatDistanceToNow(lastMessageAt, { addSuffix: false, locale: ja })}
      </span>
    </motion.div>
  );
}

const mockConversations: ConversationPreviewProps[] = [
  {
    id: "1",
    participantName: "Sakura",
    lastMessage: "ありがとうございます！新しい動画も楽しみにしてね",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 2,
    isVerified: true,
  },
  {
    id: "2",
    participantName: "Rina",
    lastMessage: "今日の配信見てくれた？",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
    unreadCount: 0,
    isVerified: true,
  },
  {
    id: "3",
    participantName: "Yuki",
    lastMessage: "商品の発送完了しました！",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: 1,
    isVerified: false,
  },
  {
    id: "4",
    participantName: "Miki",
    lastMessage: "コメントありがとう〜",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    unreadCount: 0,
    isVerified: true,
  },
];

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = mockConversations.filter((conv) =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-20 overflow-y-auto">
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border/50 p-4">
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
        {filteredConversations.length > 0 ? (
          <div className="space-y-1">
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ConversationPreview {...conversation} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">
              {searchQuery ? "検索結果がありません" : "メッセージがありません"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery 
                ? "別のキーワードで検索してください" 
                : "クリエイターにメッセージを送ってみよう"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
