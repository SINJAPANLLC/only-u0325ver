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
import type { Message, Conversation } from "@shared/schema";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/lingerie_bed_3.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/bunny_girl_5.jpg";
import logoImage from "@assets/IMG_9769_1768973936225.PNG";

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

  const userId = user?.id;

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

  const participantName = isDemo 
    ? (demoCreator?.name || "クリエイター") 
    : ((conversation as any)?.participantDisplayName || "ユーザー");
  const participantAvatar = isDemo 
    ? demoCreator?.avatar 
    : ((conversation as any)?.participantAvatarUrl || undefined);
  const participantId = (conversation as any)?.participantId;
  const participantIsCreator = (conversation as any)?.participantIsCreator;

  const handleParticipantClick = () => {
    if (isDemo) return;
    if (participantId) {
      setLocation(`/creator/${participantId}`);
    }
  };

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
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center h-14 px-3 gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-xl flex-shrink-0"
            onClick={() => setLocation("/messages")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-xl px-2 py-1.5 hover:bg-accent/40 transition-colors"
            onClick={handleParticipantClick}
            data-testid="link-participant-profile"
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={participantAvatar || logoImage} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-sm font-bold">
                  {participantName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm truncate leading-tight">{participantName}</h1>
              <p className="text-[11px] text-green-500 leading-tight">オンライン</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {isLoading && !isDemo ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-3">
              <Send className="h-8 w-8 text-pink-400" />
            </div>
            <p className="font-semibold text-sm mb-1">会話を始めよう</p>
            <p className="text-xs text-muted-foreground">メッセージを送信してみよう</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
            const isOwn = isDemo ? msg.senderId === "user" : msg.senderId === userId;
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.id}`}
              >
                {!isOwn && (
                  <Avatar className="h-7 w-7 flex-shrink-0 mt-auto">
                    <AvatarImage src={participantAvatar || logoImage} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs">
                      {participantName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[72%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 ${
                      isOwn
                        ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm shadow-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  </div>
                  <p className={`text-[10px] px-1 ${isOwn ? "text-muted-foreground/60 text-right" : "text-muted-foreground/60"}`}>
                    {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ja })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-background/95 backdrop-blur-xl border-t border-border/30 px-3 py-2.5 pb-[max(env(safe-area-inset-bottom),12px)]">
        <div className="flex items-center gap-2">
          <Input
            placeholder="メッセージを入力..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 rounded-2xl bg-muted/60 border-0 focus-visible:ring-1 focus-visible:ring-pink-500/40 text-sm h-10"
            data-testid="input-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageText.trim() || (!isDemo && sendMutation.isPending)}
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-sm flex-shrink-0"
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
