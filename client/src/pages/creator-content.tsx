import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  Video, 
  PlaySquare, 
  Trash2, 
  Image,
  Upload,
  HelpCircle,
  Loader2,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/hooks/use-auth";
import { useUpload } from "@/hooks/use-upload";
import type { Video as VideoType, SubscriptionPlan } from "@shared/schema";

export default function CreatorContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const editVideoInputRef = useRef<HTMLInputElement>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    contentType: "video" as "video" | "image",
    thumbnailUrl: "",
    thumbnailPreview: "",
    videoUrl: "",
    videoPreview: "",
    requiredTier: 0,
    title: "",
    tags: "",
    termsAgreed: {
      copyright: false,
      noMinors: false,
      mosaic: false,
      guidelines: false,
    },
  });

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingEditVideo, setIsUploadingEditVideo] = useState(false);
  const [isUploadingEditThumbnail, setIsUploadingEditThumbnail] = useState(false);
  
  const [editForm, setEditForm] = useState({
    title: "",
    thumbnailUrl: "",
    thumbnailPreview: "",
    videoUrl: "",
    videoPreview: "",
    requiredTier: 0,
    tags: "",
    isPublished: true,
  });

  const { uploadFile } = useUpload({
    onError: (error) => {
      toast({ title: "アップロードに失敗しました", description: error.message, variant: "destructive" });
    },
  });

  const { data: myVideos, isLoading } = useQuery<VideoType[]>({
    queryKey: ["/api/my-videos"],
  });

  const { data: myPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/my-subscription-plans"],
    enabled: !!user,
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      thumbnailUrl: string;
      videoUrl: string;
      requiredTier: number;
      tags: string;
    }) => {
      const response = await apiRequest("POST", "/api/videos", {
        ...data,
        contentType: data.requiredTier > 0 ? "premium" : "free",
        isPublished: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "コンテンツを投稿しました" });
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
      toast({ title: "コンテンツを削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const updateVideoMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      thumbnailUrl: string;
      videoUrl: string;
      requiredTier: number;
      tags: string;
      isPublished: boolean;
    }) => {
      const response = await apiRequest("PATCH", `/api/videos/${data.id}`, {
        title: data.title,
        thumbnailUrl: data.thumbnailUrl,
        videoUrl: data.videoUrl,
        requiredTier: data.requiredTier,
        tags: data.tags,
        isPublished: data.isPublished,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setIsEditDialogOpen(false);
      setEditingVideo(null);
      toast({ title: "コンテンツを更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm({
      contentType: "video",
      thumbnailUrl: "",
      thumbnailPreview: "",
      videoUrl: "",
      videoPreview: "",
      requiredTier: 0,
      title: "",
      tags: "",
      termsAgreed: {
        copyright: false,
        noMinors: false,
        mosaic: false,
        guidelines: false,
      },
    });
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "動画ファイルを選択してください", variant: "destructive" });
      return;
    }

    setIsUploadingVideo(true);
    const preview = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, videoPreview: preview }));

    const result = await uploadFile(file);
    if (result) {
      setForm(prev => ({ ...prev, videoUrl: result.url || result.objectPath }));
      toast({ title: "動画をアップロードしました" });
    }
    setIsUploadingVideo(false);
  };

  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "画像ファイルを選択してください", variant: "destructive" });
      return;
    }

    setIsUploadingThumbnail(true);
    const preview = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, thumbnailPreview: preview }));

    const result = await uploadFile(file);
    if (result) {
      setForm(prev => ({ ...prev, thumbnailUrl: result.url || result.objectPath }));
      toast({ title: "サムネイルをアップロードしました" });
    }
    setIsUploadingThumbnail(false);
  };

  const handleImageContentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "画像ファイルを選択してください", variant: "destructive" });
      return;
    }

    setIsUploadingThumbnail(true);
    const preview = URL.createObjectURL(file);
    setForm(prev => ({ ...prev, thumbnailPreview: preview }));

    const result = await uploadFile(file);
    if (result) {
      const url = result.url || result.objectPath;
      setForm(prev => ({ 
        ...prev, 
        thumbnailUrl: url,
        videoUrl: url
      }));
      toast({ title: "画像をアップロードしました" });
    }
    setIsUploadingThumbnail(false);
  };

  const allTermsAgreed = 
    form.termsAgreed.copyright && 
    form.termsAgreed.noMinors && 
    form.termsAgreed.mosaic && 
    form.termsAgreed.guidelines;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title) {
      toast({ title: "タイトルを入力してください", variant: "destructive" });
      return;
    }
    
    if (!form.thumbnailUrl) {
      toast({ title: "サムネイル画像を選択してください", variant: "destructive" });
      return;
    }

    if (form.contentType === "video" && !form.videoUrl) {
      toast({ title: "動画を選択してください", variant: "destructive" });
      return;
    }

    if (!allTermsAgreed) {
      toast({ title: "規約への同意が必要です", variant: "destructive" });
      return;
    }

    createVideoMutation.mutate({
      title: form.title,
      thumbnailUrl: form.thumbnailUrl,
      videoUrl: form.contentType === "video" ? form.videoUrl : form.thumbnailUrl,
      requiredTier: form.requiredTier,
      tags: form.tags,
    });
  };

  const openEditDialog = (video: VideoType) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title,
      thumbnailUrl: video.thumbnailUrl || "",
      thumbnailPreview: video.thumbnailUrl || "",
      videoUrl: video.videoUrl || "",
      videoPreview: video.videoUrl || "",
      requiredTier: video.requiredTier || 0,
      tags: video.tags || "",
      isPublished: video.isPublished !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({ title: "動画ファイルを選択してください", variant: "destructive" });
      return;
    }

    setIsUploadingEditVideo(true);
    const preview = URL.createObjectURL(file);
    setEditForm(prev => ({ ...prev, videoPreview: preview }));

    const result = await uploadFile(file);
    if (result) {
      setEditForm(prev => ({ ...prev, videoUrl: result.url || result.objectPath }));
      toast({ title: "動画をアップロードしました" });
    }
    setIsUploadingEditVideo(false);
  };

  const handleEditThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "画像ファイルを選択してください", variant: "destructive" });
      return;
    }

    setIsUploadingEditThumbnail(true);
    const preview = URL.createObjectURL(file);
    setEditForm(prev => ({ ...prev, thumbnailPreview: preview }));

    const result = await uploadFile(file);
    if (result) {
      setEditForm(prev => ({ ...prev, thumbnailUrl: result.url || result.objectPath }));
      toast({ title: "サムネイルをアップロードしました" });
    }
    setIsUploadingEditThumbnail(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingVideo) return;
    
    if (!editForm.title) {
      toast({ title: "タイトルを入力してください", variant: "destructive" });
      return;
    }
    
    if (!editForm.thumbnailUrl) {
      toast({ title: "サムネイル画像を選択してください", variant: "destructive" });
      return;
    }

    if (!editForm.videoUrl) {
      toast({ title: "動画を選択してください", variant: "destructive" });
      return;
    }

    updateVideoMutation.mutate({
      id: editingVideo.id,
      title: editForm.title,
      thumbnailUrl: editForm.thumbnailUrl,
      videoUrl: editForm.videoUrl,
      requiredTier: editForm.requiredTier,
      tags: editForm.tags,
      isPublished: editForm.isPublished,
    });
  };

  const formatCount = (count: number) => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getPlanName = (tier: number) => {
    if (tier === 0) return "無料（全員に公開）";
    if (myPlans && myPlans.length > 0) {
      const plan = myPlans.find(p => p.tier === tier);
      if (plan) return `${plan.name}（${plan.price.toLocaleString()}pt/月）`;
    }
    const defaultNames: Record<number, string> = {
      1: "ベーシック",
      2: "スタンダード",
      3: "プレミアム",
    };
    return defaultNames[tier] || `Tier ${tier}`;
  };

  return (
    <motion.div 
      className="h-full bg-background overflow-y-auto scrollbar-hide"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
    >
      <div className="flex items-center justify-between gap-2 h-14 px-4 border-b border-white/10 bg-black/95 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost"
            className="h-9 w-9 rounded-xl"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Button>
          <h1 className="font-bold text-base text-white">コンテンツ管理</h1>
        </div>
        <Button 
          size="sm"
          className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
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
                className="flex gap-3 p-3 bg-muted/40 rounded-lg"
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
                    <span className={video.isPublished ? "text-green-500" : "text-yellow-500"}>
                      {video.isPublished ? "公開中" : "非公開"}
                    </span>
                    <span className={video.contentType === "premium" ? "text-pink-500" : ""}>
                      {video.contentType === "premium" ? getPlanName(video.requiredTier || 1) : "無料"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(video)}
                    data-testid={`button-edit-${video.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <Video className="h-12 w-12 mb-3 opacity-50" />
            <p>まだコンテンツがありません</p>
            <p className="text-sm mt-1">新規投稿ボタンからコンテンツを追加しましょう</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新規コンテンツを投稿</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>コンテンツタイプ *</Label>
              <Select
                value={form.contentType}
                onValueChange={(value) => {
                  setForm({ ...form, contentType: value as "video" | "image", videoUrl: "", thumbnailUrl: "", videoPreview: "", thumbnailPreview: "" });
                }}
              >
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      動画
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      画像
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.contentType === "video" ? (
              <>
                <div>
                  <Label>動画を選択 *</Label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoSelect}
                  />
                  <div 
                    className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-pink-500 transition-colors"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    {isUploadingVideo ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                        <p className="text-sm text-muted-foreground">アップロード中...</p>
                      </div>
                    ) : form.videoPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <video 
                          src={form.videoPreview} 
                          className="w-full max-h-32 object-contain rounded"
                        />
                        <p className="text-xs text-green-500">アップロード完了</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">クリックして動画を選択</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>
                    サムネイル画像を選択 * 
                    <span className="text-xs text-muted-foreground ml-2">（縦型推奨）</span>
                  </Label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailSelect}
                  />
                  <div 
                    className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-pink-500 transition-colors"
                    onClick={() => thumbnailInputRef.current?.click()}
                  >
                    {isUploadingThumbnail ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                        <p className="text-sm text-muted-foreground">アップロード中...</p>
                      </div>
                    ) : form.thumbnailPreview ? (
                      <div className="flex items-center justify-center">
                        <img 
                          src={form.thumbnailPreview} 
                          alt="Preview" 
                          className="w-20 h-28 object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Image className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">クリックしてサムネイルを選択</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <Label>
                  画像を選択 * 
                  <span className="text-xs text-muted-foreground ml-2">（縦型推奨）</span>
                </Label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageContentSelect}
                />
                <div 
                  className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-pink-500 transition-colors"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  {isUploadingThumbnail ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                      <p className="text-sm text-muted-foreground">アップロード中...</p>
                    </div>
                  ) : form.thumbnailPreview ? (
                    <div className="flex items-center justify-center">
                      <img 
                        src={form.thumbnailPreview} 
                        alt="Preview" 
                        className="w-20 h-28 object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Image className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">クリックして画像を選択</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label>公開範囲 *</Label>
              <Select
                value={form.requiredTier.toString()}
                onValueChange={(value) => setForm({ ...form, requiredTier: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-required-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{getPlanName(0)}</SelectItem>
                  {myPlans && myPlans.length > 0 ? (
                    myPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.tier.toString()}>
                        {plan.name}（{plan.price.toLocaleString()}pt/月）
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="1">{getPlanName(1)}</SelectItem>
                      <SelectItem value="2">{getPlanName(2)}</SelectItem>
                      <SelectItem value="3">{getPlanName(3)}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="コンテンツのタイトル"
                data-testid="input-title"
              />
            </div>

            <div>
              <Label htmlFor="tags">タグ</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="タグをカンマ区切りで入力（例: グラビア, 水着, 撮影会）"
                data-testid="input-tags"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-base font-semibold">規約への同意 *</Label>
              
              <div className="flex items-start gap-2">
                <Checkbox
                  id="copyright"
                  checked={form.termsAgreed.copyright}
                  onCheckedChange={(checked) => 
                    setForm({ 
                      ...form, 
                      termsAgreed: { ...form.termsAgreed, copyright: checked === true } 
                    })
                  }
                  data-testid="checkbox-copyright"
                />
                <label htmlFor="copyright" className="text-sm leading-tight cursor-pointer">
                  投稿内容が著作権の侵害とわいせつ物の公開にあたらない事を確認した。
                </label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="noMinors"
                  checked={form.termsAgreed.noMinors}
                  onCheckedChange={(checked) => 
                    setForm({ 
                      ...form, 
                      termsAgreed: { ...form.termsAgreed, noMinors: checked === true } 
                    })
                  }
                  data-testid="checkbox-no-minors"
                />
                <label htmlFor="noMinors" className="text-sm leading-tight cursor-pointer">
                  投稿内容に未成年者が写っていないこと、また未成年者を連想させる表現等を含まないことを確認した。
                </label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="mosaic"
                  checked={form.termsAgreed.mosaic}
                  onCheckedChange={(checked) => 
                    setForm({ 
                      ...form, 
                      termsAgreed: { ...form.termsAgreed, mosaic: checked === true } 
                    })
                  }
                  data-testid="checkbox-mosaic"
                />
                <label htmlFor="mosaic" className="text-sm leading-tight cursor-pointer">
                  性器または挿入に対してモザイク修正を行っているかを確認した。
                </label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="guidelines"
                  checked={form.termsAgreed.guidelines}
                  onCheckedChange={(checked) => 
                    setForm({ 
                      ...form, 
                      termsAgreed: { ...form.termsAgreed, guidelines: checked === true } 
                    })
                  }
                  data-testid="checkbox-guidelines"
                />
                <label htmlFor="guidelines" className="text-sm leading-tight cursor-pointer">
                  当社の利用規約およびガイドラインに則ったコンテンツであることを確認しました。
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createVideoMutation.isPending || !allTermsAgreed || isUploadingVideo || isUploadingThumbnail}
              data-testid="button-submit"
            >
              {createVideoMutation.isPending ? "投稿中..." : "投稿する"}
            </Button>

            <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
              <p>
                いつも安心安全なプラットフォームの運営にご協力頂きありがとうございます。
                利用規約に則したコンテンツの投稿をお願いいたします。
              </p>
              <p className="text-destructive/80">
                他人のコンテンツをアップロードする行為は著作権の侵害となり10年以下の懲役又は1000万円以下の罰金が課せられます。
              </p>
              <p className="text-destructive/80">
                モザイク処理を行っていないコンテンツはわいせつ物頒布等となり犯罪行為ですのでおやめください。
              </p>
              <p>
                性器や挿入箇所へのモザイク修正が行われていない場合、全ての投稿を削除する可能性があります。
              </p>
              <button 
                type="button"
                className="text-pink-500 underline flex items-center gap-1"
                onClick={() => setLocation("/guidelines")}
              >
                <HelpCircle className="h-3 w-3" />
                掲載ガイドライン
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>コンテンツを編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>動画を変更</Label>
              <input
                ref={editVideoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleEditVideoSelect}
              />
              <div 
                className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-pink-500 transition-colors"
                onClick={() => editVideoInputRef.current?.click()}
              >
                {isUploadingEditVideo ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                    <p className="text-sm text-muted-foreground">アップロード中...</p>
                  </div>
                ) : editForm.videoPreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <video 
                      src={editForm.videoPreview} 
                      className="w-full max-h-32 object-contain rounded"
                    />
                    <p className="text-xs text-green-500">クリックして変更</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">クリックして動画を選択</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>サムネイル画像を変更</Label>
              <input
                ref={editThumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleEditThumbnailSelect}
              />
              <div 
                className="mt-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-pink-500 transition-colors"
                onClick={() => editThumbnailInputRef.current?.click()}
              >
                {isUploadingEditThumbnail ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                    <p className="text-sm text-muted-foreground">アップロード中...</p>
                  </div>
                ) : editForm.thumbnailPreview ? (
                  <div className="flex items-center justify-center">
                    <img 
                      src={editForm.thumbnailPreview} 
                      alt="Preview" 
                      className="w-20 h-28 object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">クリックしてサムネイルを選択</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>公開範囲</Label>
              <Select
                value={editForm.requiredTier.toString()}
                onValueChange={(value) => setEditForm({ ...editForm, requiredTier: parseInt(value) })}
              >
                <SelectTrigger data-testid="edit-select-required-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{getPlanName(0)}</SelectItem>
                  {myPlans && myPlans.length > 0 ? (
                    myPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.tier.toString()}>
                        {plan.name}（{plan.price.toLocaleString()}pt/月）
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="1">{getPlanName(1)}</SelectItem>
                      <SelectItem value="2">{getPlanName(2)}</SelectItem>
                      <SelectItem value="3">{getPlanName(3)}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-title">タイトル *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="コンテンツのタイトル"
                data-testid="edit-input-title"
              />
            </div>

            <div>
              <Label htmlFor="edit-tags">タグ</Label>
              <Input
                id="edit-tags"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="タグをカンマ区切りで入力"
                data-testid="edit-input-tags"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-published"
                checked={editForm.isPublished}
                onCheckedChange={(checked) => 
                  setEditForm({ ...editForm, isPublished: checked === true })
                }
                data-testid="edit-checkbox-published"
              />
              <label htmlFor="edit-published" className="text-sm cursor-pointer">
                公開する
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updateVideoMutation.isPending || isUploadingEditVideo || isUploadingEditThumbnail}
              data-testid="button-edit-submit"
            >
              {updateVideoMutation.isPending ? "更新中..." : "更新する"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-24" />
    </motion.div>
  );
}
