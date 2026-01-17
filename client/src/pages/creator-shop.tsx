import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Plus, 
  Package, 
  Trash2,
  Tag,
  Upload,
  ImageIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import type { Product } from "@shared/schema";

export default function CreatorShop() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    productType: "digital" as "digital" | "physical",
    isAvailable: true,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "画像ファイルを選択してください", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "ファイルサイズは10MB以下にしてください", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error("Failed to get upload URL");

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      const imageUrl = objectPath;
      setForm(prev => ({ ...prev, imageUrl }));
      setImagePreview(URL.createObjectURL(file));
      toast({ title: "画像をアップロードしました" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "画像のアップロードに失敗しました", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setForm(prev => ({ ...prev, imageUrl: "" }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { data: myProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/my-products"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        price: parseInt(data.price) || 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      setForm({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        productType: "digital",
        isAvailable: true,
      });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({ title: "商品を登録しました" });
    },
    onError: (error: any) => {
      const message = error?.message || "登録に失敗しました。クリエイター登録が必要です。";
      toast({ title: message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "商品を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast({ title: "商品名を入力してください", variant: "destructive" });
      return;
    }
    if (!form.price || parseInt(form.price) <= 0) {
      toast({ title: "価格を入力してください", variant: "destructive" });
      return;
    }
    createProductMutation.mutate(form);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP").format(price);
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
          <h1 className="text-lg font-bold">ショップ管理</h1>
        </div>
        <Button 
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-add-product"
        >
          <Plus className="h-4 w-4 mr-1" />
          商品追加
        </Button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : myProducts && myProducts.length > 0 ? (
          <div className="space-y-3">
            {myProducts.map((product) => (
              <div 
                key={product.id}
                className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                data-testid={`product-item-${product.id}`}
              >
                <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <p className="text-lg font-bold text-pink-500 mt-1">
                    ¥{formatPrice(product.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {product.productType === "digital" ? "デジタル" : "物販"}
                    </Badge>
                    <span className={`text-xs ${product.isAvailable ? "text-green-500" : "text-yellow-500"}`}>
                      {product.isAvailable ? "販売中" : "非公開"}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteProductMutation.mutate(product.id)}
                  data-testid={`button-delete-${product.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-50" />
            <p>まだ商品がありません</p>
            <p className="text-sm mt-1">商品追加ボタンから商品を登録しましょう</p>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新規商品を登録</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">商品名 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="商品名"
                data-testid="input-name"
              />
            </div>
            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="商品の説明"
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div>
              <Label htmlFor="price">価格（ポイント）*</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="1000"
                  className="pl-10"
                  data-testid="input-price"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">1ポイント = 1円</p>
            </div>
            <div>
              <Label>商品画像</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                data-testid="input-image-file"
              />
              {imagePreview || form.imageUrl ? (
                <div className="relative mt-2">
                  <img 
                    src={imagePreview || form.imageUrl}
                    alt="商品画像プレビュー"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={clearImage}
                    data-testid="button-clear-image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/50 transition-colors"
                  data-testid="button-upload-image"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                      <p className="text-sm text-muted-foreground">アップロード中...</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">クリックして画像をアップロード</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">10MB以下</p>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="productType">商品タイプ</Label>
              <Select
                value={form.productType}
                onValueChange={(value) => setForm({ ...form, productType: value as "digital" | "physical" })}
              >
                <SelectTrigger data-testid="select-product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">デジタル商品</SelectItem>
                  <SelectItem value="physical">物販商品</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="available">販売する</Label>
              <Switch
                id="available"
                checked={form.isAvailable}
                onCheckedChange={(checked) => setForm({ ...form, isAvailable: checked })}
                data-testid="switch-available"
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
                disabled={createProductMutation.isPending}
                data-testid="button-submit"
              >
                {createProductMutation.isPending ? "登録中..." : "登録する"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="h-24" />
    </motion.div>
  );
}
