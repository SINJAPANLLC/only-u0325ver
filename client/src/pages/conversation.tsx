import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Send, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Message, Conversation } from "@shared/schema";

const AUTO_REPLY_PREFIXES = ["【ご購入ありがとうございます】", "【自動返信】"];

function isAutoReply(content: string) {
  return AUTO_REPLY_PREFIXES.some((p) => content.startsWith(p));
}

export default function ConversationPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", params.id],
    enabled: !!params.id,
  });

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", params.id, "messages"],
    enabled: !!params.id,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/conversations/${params.id}/messages`, { content });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", params.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const userId = user?.id;
  const participantName = (conversation as any)?.participantDisplayName || "ユーザー";
  const participantAvatar = (conversation as any)?.participantAvatarUrl || undefined;
  const participantId = (conversation as any)?.participantId;

  const handleParticipantClick = () => {
    if (participantId) setLocation(`/creator/${participantId}`);
  };

  const handleSend = () => {
    if (!messageText.trim() || sendMutation.isPending) return;
    sendMutation.mutate(messageText.trim());
  };

  const displayMessages = [...(messages || [])].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <header className="sticky top-0 z-20 bg-black border-b border-white/10 flex-shrink-0">
        <div className="flex items-center h-14 px-3 gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl flex-shrink-0 text-white hover:bg-white/10"
            onClick={() => setLocation("/messages")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-white/10 transition-colors"
            onClick={handleParticipantClick}
            data-testid="link-participant-profile"
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={participantAvatar} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-sm font-bold">
                {participantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="font-bold text-sm truncate leading-tight text-white">{participantName}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              <Send className="h-8 w-8 text-white/20" />
            </div>
            <p className="font-semibold text-sm mb-1 text-white">会話を始めよう</p>
            <p className="text-xs text-white/40">メッセージを送信してみよう</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isOwn = msg.senderId === userId;
            const autoReply = !isOwn && isAutoReply(msg.content);

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.id}`}
              >
                {!isOwn && (
                  <Avatar className="h-7 w-7 flex-shrink-0 mt-auto">
                    <AvatarImage src={participantAvatar} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs">
                      {participantName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[72%] min-w-0 ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {autoReply ? (
                    <div className="rounded-2xl rounded-bl-sm border border-pink-500/30 bg-pink-500/5 overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 border-b border-pink-500/20">
                        <Zap className="h-3 w-3 text-pink-400 flex-shrink-0" />
                        <span className="text-[10px] text-pink-400 font-medium">自動返信</span>
                      </div>
                      <p className="text-sm leading-relaxed break-all px-3 py-2 text-white/90">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 min-w-0 ${
                        isOwn
                          ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm shadow-sm"
                          : "bg-white/10 text-white rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-all">{msg.content}</p>
                    </div>
                  )}
                  <p className={`text-[10px] px-1 text-white/30 ${isOwn ? "text-right" : ""}`}>
                    {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ja })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-black border-t border-white/10 px-3 py-2.5 pb-[max(env(safe-area-inset-bottom),12px)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="メッセージを入力..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-2xl bg-white/10 border-0 focus-visible:ring-1 focus-visible:ring-pink-500/40 text-sm h-10 text-white placeholder:text-white/40"
            data-testid="input-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMutation.isPending}
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-sm flex-shrink-0"
            data-testid="button-send"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
