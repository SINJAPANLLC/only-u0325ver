import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Radio, 
  Play, 
  Square, 
  Users,
  Clock,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { LiveStream } from "@shared/schema";

export default function CreatorLive() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });

  const { data: myLiveStreams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/my-live"],
  });

  const startLiveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const response = await apiRequest("POST", "/api/live", {
        ...data,
        status: "live",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      setIsDialogOpen(false);
      setForm({ title: "", description: "", thumbnailUrl: "" });
      toast({ title: "ライブ配信を開始しました" });
    },
    onError: (error: any) => {
      const message = error?.message || "配信の開始に失敗しました。クリエイター登録が必要です。";
      toast({ title: message, variant: "destructive" });
    },
  });

  const endLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/live/${id}`, {
        status: "ended",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      toast({ title: "配信を終了しました" });
    },
    onError: () => {
      toast({ title: "配信終了に失敗しました", variant: "destructive" });
    },
  });

  const deleteLiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/live/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-live"] });
      queryClient.invalidateQueries({ queryKey: ["/api/live"] });
      toast({ title: "配信履歴を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast({ title: "タイトルを入力してください", variant: "destructive" });
      return;
    }
    startLiveMutation.mutate(form);
  };

  const activeStream = myLiveStreams?.find(s => s.status === "live");
  const pastStreams = myLiveStreams?.filter(s => s.status !== "live") || [];

  return (
    <motion.div 
      className="h-full bg-background overflow-y-auto scrollbar-hide"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold">ライブ配信</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {activeStream ? (
          <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 bg-pink-500 rounded-full animate-pulse" />
              <span className="font-bold text-pink-500">配信中</span>
            </div>
            <h3 className="font-bold text-lg">{activeStream.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {activeStream.viewerCount || 0} 視聴者
              </span>
            </div>
            <Button
              className="w-full mt-4 bg-pink-500 hover:bg-pink-600"
              onClick={() => endLiveMutation.mutate(activeStream.id)}
              disabled={endLiveMutation.isPending}
              data-testid="button-end-live"
            >
              <Square className="h-4 w-4 mr-2" />
              {endLiveMutation.isPending ? "終了中..." : "配信を終了"}
            </Button>
          </div>
        ) : (
          <div className="p-6 bg-muted/50 rounded-xl text-center">
            <Radio className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-bold mb-2">ライブ配信を開始</h3>
            <p className="text-sm text-muted-foreground mb-4">
              フォロワーにリアルタイムで配信しましょう
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-pink-500 hover:bg-pink-600"
              data-testid="button-start-live"
            >
              <Play className="h-4 w-4 mr-2" />
              配信を開始
            </Button>
          </div>
        )}

        <div>
          <h2 className="font-bold mb-3">配信履歴</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : pastStreams.length > 0 ? (
            <div className="space-y-2">
              {pastStreams.map((stream) => (
                <div 
                  key={stream.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  data-testid={`stream-item-${stream.id}`}
                >
                  <div className="w-16 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    {stream.thumbnailUrl ? (
                      <img 
                        src={stream.thumbnailUrl} 
                        alt={stream.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Radio className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{stream.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">
                        {stream.status === "ended" ? "終了" : stream.status}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {stream.viewerCount || 0}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteLiveMutation.mutate(stream.id)}
                    data-testid={`button-delete-${stream.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">配信履歴はありません</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ライブ配信を開始</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="配信のタイトル"
                data-testid="input-title"
              />
            </div>
            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="配信の説明"
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div>
              <Label htmlFor="thumbnailUrl">サムネイルURL</Label>
              <Input
                id="thumbnailUrl"
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-thumbnail"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-pink-500 hover:bg-pink-600"
                disabled={startLiveMutation.isPending}
                data-testid="button-submit"
              >
                {startLiveMutation.isPending ? "開始中..." : "配信開始"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-24" />
    </motion.div>
  );
}
