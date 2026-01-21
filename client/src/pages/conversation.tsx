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
import type { Message, Conversation, CreatorProfile, User } from "@shared/schema";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/lingerie_bed_3.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/bunny_girl_5.jpg";

const demoCreators: Record<string, { name: string; avatar: string }> = {
  "demo-1": { name: "れいな💋", avatar: img1 },
  "demo-2": { name: "ゆあ🌙", avatar: img2 },
  "demo-3": { name: "みお", avatar: img3 },
  "demo-4": { name: "さき💜", avatar: img4 },
  "demo-5": { name: "ひな🐰", avatar: img5 },
};

const demoMessages: Record<string, { id: string; senderId: string; content: string; createdAt: Date }[]> = {
  "demo-1": [
    { id: "m1", senderId: "creator", content: "こんにちは！フォローありがとう💕", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: "m2", senderId: "user", content: "いつも配信楽しみにしてます！", createdAt: new Date(Date.now() - 1000 * 60 * 60) },
    { id: "m3", senderId: "creator", content: "嬉しい！今夜も配信するね", createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    { id: "m4", senderId: "creator", content: "今夜の配信楽しみにしててね💕", createdAt: new Date(Date.now() - 1000 * 60 * 5) },
  ],
  "demo-2": [
    { id: "m1", senderId: "creator", content: "新しい写真集出したよ🌙", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    { id: "m2", senderId: "user", content: "買いました！すごく良かったです", createdAt: new Date(Date.now() - 1000 * 60 * 60) },
    { id: "m3", senderId: "creator", content: "写真集見てくれた？感想聞かせて♡", createdAt: new Date(Date.now() - 1000 * 60 * 30) },
  ],
  "demo-3": [
    { id: "m1", senderId: "user", content: "ASMRの新作最高でした！", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) },
    { id: "m2", senderId: "creator", content: "ありがとう！嬉しい😊", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
  ],
  "demo-4": [
    { id: "m1", senderId: "creator", content: "いつもありがとう💜", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6) },
    { id: "m2", senderId: "creator", content: "2ショットでお話しよう？", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
  ],
  "demo-5": [
    { id: "m1", senderId: "creator", content: "バニーコスプレどうだった？🐰", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25) },
    { id: "m2", senderId: "user", content: "めっちゃ可愛かったです！", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24.5) },
    { id: "m3", senderId: "creator", content: "新しいコスプレ写真撮ったよ！", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
  ],
};

export default function ConversationPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState("");
  const [localDemoMessages, setLocalDemoMessages] = useState<{ id: string; senderId: string; content: string; createdAt: Date }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDemo = params.id?.startsWith("demo-");
  const demoCreator = isDemo ? demoCreators[params.id || ""] : null;

  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", params.id],
    enabled: !!params.id && !isDemo,
  });

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", params.id, "messages"],
    enabled: !!params.id && !isDemo,
    refetchInterval: 5000,
  });

  const { data: creators } = useQuery<CreatorProfile[]>({
    queryKey: ["/api/creators"],
    enabled: !isDemo,
  });

  const userId = user?.id;
  const participantId = conversation
    ? (conversation.participant1Id === userId ? conversation.participant2Id : conversation.participant1Id)
    : null;

  const { data: participantUser } = useQuery<{ id: string; username: string; avatarUrl: string | null }>({
    queryKey: ["/api/users", participantId],
    enabled: !!participantId && !isDemo,
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
    if (isDemo && params.id) {
      setLocalDemoMessages(demoMessages[params.id] || []);
    }
  }, [isDemo, params.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, localDemoMessages]);

  const participant = creators?.find(c => c.userId === participantId);
  const participantName = isDemo 
    ? (demoCreator?.name || "クリエイター") 
    : (participant?.displayName || participantUser?.username || "ユーザー");
  const participantAvatar = isDemo 
    ? demoCreator?.avatar 
    : (participantUser?.avatarUrl || undefined);

  const handleSend = () => {
    if (!messageText.trim()) return;
    
    if (isDemo) {
      const newMsg = {
        id: `user-${Date.now()}`,
        senderId: "user",
        content: messageText.trim(),
        createdAt: new Date(),
      };
      setLocalDemoMessages(prev => [...prev, newMsg]);
      setMessageText("");
    } else if (!sendMutation.isPending) {
      sendMutation.mutate(messageText.trim());
    }
  };

  const displayMessages = isDemo 
    ? localDemoMessages
    : [...(messages || [])].sort(
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
            <AvatarImage src={participantAvatar} className="object-cover" />
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
        {isLoading && !isDemo ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">メッセージを送信してみよう</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isOwn = isDemo ? msg.senderId === "user" : msg.senderId === userId;
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
                  <p className="text-sm break-all">{msg.content}</p>
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
            disabled={!messageText.trim() || (!isDemo && sendMutation.isPending)}
            className="rounded-full bg-pink-500 hover:bg-pink-600"
            data-testid="button-send"
          >
            {!isDemo && sendMutation.isPending ? (
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
