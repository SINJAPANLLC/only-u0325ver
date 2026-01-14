import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Message, Conversation, CreatorProfile } from "@shared/schema";

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

  const { data: creators } = useQuery<CreatorProfile[]>({
    queryKey: ["/api/creators"],
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
  const participantId = conversation
    ? (conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id)
    : null;

  const participant = creators?.find(c => c.userId === participantId);
  const participantName = participant?.displayName || "ユーザー";

  const handleSend = () => {
    if (messageText.trim() && !sendMutation.isPending) {
      sendMutation.mutate(messageText.trim());
    }
  };

  const sortedMessages = [...(messages || [])].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setLocation("/messages")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white">
              {participantName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-semibold">{participantName}</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">メッセージを送信してみよう</p>
          </div>
        ) : (
          sortedMessages.map((msg) => {
            const isOwn = msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? "bg-pink-500 text-white rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                    {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ja })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 bg-background border-t p-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="メッセージを入力..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-full"
            data-testid="input-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMutation.isPending}
            className="rounded-full bg-pink-500 hover:bg-pink-600"
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
