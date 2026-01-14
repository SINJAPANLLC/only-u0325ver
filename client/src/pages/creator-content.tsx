import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  Video, 
  PlaySquare, 
  Trash2, 
  Eye, 
  EyeOff,
  Upload,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Video as VideoType } from "@shared/schema";

export default function CreatorContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    videoUrl: "",
    contentType: "free" as "free" | "premium",
    isPublished: true,
  });

  const { data: myVideos, isLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/my-videos"],
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const response = await apiRequest("POST", "/api/videos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setIsDialogOpen(false);
      setForm({
        title: "",
        description: "",
        thumbnailUrl: "",
        videoUrl: "",
        contentType: "free",
        isPublished: true,
      });
      toast({ title: "動画を投稿しました" });
    },
    onError: (error: any) => {
      const message = error?.message || "投稿に失敗しました。クリエイター登録が必要です。";
      toast({ title: message, variant: "destructive" });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/videos/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "動画を削除しました" });
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
    createVideoMutation.mutate(form);
  };

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

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
          <h1 className="text-lg font-bold">コンテンツ管理</h1>
        </div>
        <Button 
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-add-video"
        >
          <Plus className="h-4 w-4 mr-1" />
          新規投稿
        </Button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : myVideos && myVideos.length > 0 ? (
          <div className="space-y-3">
            {myVideos.map((video) => (
              <div 
                key={video.id}
                className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                data-testid={`video-item-${video.id}`}
              >
                <div className="w-24 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{video.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <PlaySquare className="h-3 w-3" />
                      {formatCount(video.viewCount || 0)}
                    </span>
                    <span className={video.isPublished ? "text-green-500" : "text-yellow-500"}>
                      {video.isPublished ? "公開中" : "非公開"}
                    </span>
                    <span className={video.contentType === "premium" ? "text-pink-500" : ""}>
                      {video.contentType === "premium" ? "プレミアム" : "無料"}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteVideoMutation.mutate(video.id)}
                  data-testid={`button-delete-${video.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <Video className="h-12 w-12 mb-3 opacity-50" />
            <p>まだ動画がありません</p>
            <p className="text-sm mt-1">新規投稿ボタンから動画を追加しましょう</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新規動画を投稿</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="動画のタイトル"
                data-testid="input-title"
              />
            </div>
            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="動画の説明"
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
            <div>
              <Label htmlFor="videoUrl">動画URL</Label>
              <Input
                id="videoUrl"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-video-url"
              />
            </div>
            <div>
              <Label htmlFor="contentType">コンテンツタイプ</Label>
              <Select
                value={form.contentType}
                onValueChange={(value) => setForm({ ...form, contentType: value as "free" | "premium" })}
              >
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">無料</SelectItem>
                  <SelectItem value="premium">プレミアム（有料）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="published">公開する</Label>
              <Switch
                id="published"
                checked={form.isPublished}
                onCheckedChange={(checked) => setForm({ ...form, isPublished: checked })}
                data-testid="switch-published"
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
                className="flex-1"
                disabled={createVideoMutation.isPending}
                data-testid="button-submit"
              >
                {createVideoMutation.isPending ? "投稿中..." : "投稿する"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-24" />
    </motion.div>
  );
}
