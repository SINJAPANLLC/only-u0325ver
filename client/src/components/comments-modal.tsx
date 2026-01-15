import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Heart } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface CommentWithUser {
  id: string;
  videoId: string;
  userId: string;
  content: string;
  likeCount: number;
  createdAt: string;
  userDisplayName?: string;
  userAvatarUrl?: string;
}

interface CommentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  commentCount: number;
}

export function CommentsModal({ open, onOpenChange, videoId, commentCount }: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();

  const { data: comments, isLoading } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/videos", videoId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${videoId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: open && !!videoId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/videos/${videoId}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/videos", videoId, "comments"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    addCommentMutation.mutate(newComment.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col [&>button]:hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold">コメント {commentCount > 0 && `(${commentCount})`}</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
            data-testid="button-close-comments"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">まだコメントはありません</p>
              <p className="text-gray-400 text-sm mt-1">最初のコメントを投稿しよう</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={comment.userAvatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs">
                      {comment.userDisplayName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {comment.userDisplayName || "ユーザー"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ja })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                      {comment.content}
                    </p>
                    <button className="flex items-center gap-1 mt-1 text-gray-400 hover:text-pink-500 transition-colors">
                      <Heart className="h-3.5 w-3.5" />
                      <span className="text-xs">{comment.likeCount || 0}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user ? (
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-xs">
                  {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="コメントを入力..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 h-10 rounded-full border-gray-200 dark:border-gray-700"
                data-testid="input-comment"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="h-10 w-10 rounded-full bg-pink-500 hover:bg-pink-600"
                data-testid="button-send-comment"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-500">コメントするにはログインしてください</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
