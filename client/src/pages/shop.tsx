import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Download, Package, Lock, Loader2, Check, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import type { Product, UserProfile } from "@shared/schema";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/lingerie_bed_3.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/bunny_girl_5.jpg";
import img6 from "@assets/generated_images/micro_bikini_6.jpg";
import img7 from "@assets/generated_images/sexy_maid_7.jpg";
import img8 from "@assets/generated_images/topless_morning_8.jpg";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  creatorName: string;
  creatorAvatar?: string;
  productType: "digital" | "physical";
  isAvailable: boolean;
  isPremium?: boolean;
  isLimited?: boolean;
  salesCount?: number;
  onPurchase: () => void;
}

function ProductCard({
  id,
  name,
  price,
  imageUrl,
  productType,
  isAvailable,
  isPremium,
  onPurchase,
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onPurchase}
      className="relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer"
      data-testid={`card-product-${id}`}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
          {productType === "digital" ? (
            <Download className="h-16 w-16 text-white/30" />
          ) : (
            <Package className="h-16 w-16 text-white/30" />
          )}
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      <Badge 
        className={`absolute top-2 left-2 border-0 text-white text-xs px-3 py-1 ${
          productType === "digital" 
            ? "bg-pink-500" 
            : "bg-gray-600"
        }`}
        data-testid={`badge-product-type-${id}`}
      >
        {productType === "digital" ? "デジタル" : "物販"}
      </Badge>

      {isPremium && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
          <Lock className="h-10 w-10 text-white" />
          <span className="text-white text-xs font-medium">メンバー限定</span>
        </div>
      )}

      {!isAvailable && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Badge variant="secondary" className="text-base px-4 py-2">
            SOLD OUT
          </Badge>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-bold text-sm line-clamp-2 leading-tight mb-1" data-testid={`text-product-name-${id}`}>
          {name}
        </h3>
        <p className="text-pink-400 font-bold text-sm" data-testid={`text-product-price-${id}`}>
          {price.toLocaleString()}pt
        </p>
      </div>
    </motion.div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
      <Skeleton className="absolute inset-0" />
    </div>
  );
}

function EmptyProductState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center mb-5">
        <ShoppingBag className="h-10 w-10 text-pink-400" />
      </div>
      <h3 className="font-bold text-lg mb-2" data-testid="text-empty-products">商品がありません</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        クリエイターが商品を出品するとここに表示されます
      </p>
    </motion.div>
  );
}

interface DemoProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  creatorName: string;
  productType: "digital" | "physical";
  isAvailable: boolean;
  isPremium?: boolean;
  isLimited?: boolean;
  salesCount?: number;
  imageUrl: string;
}

const demoProducts: DemoProduct[] = [
  {
    id: "prod-1",
    name: "【過激写真集】全裸ギリギリショット 100枚",
    description: "モザイク無し・修正無しの限界ショット",
    price: 3500,
    originalPrice: 5000,
    creatorName: "Risa",
    productType: "digital",
    isAvailable: true,
    isPremium: false,
    isLimited: true,
    salesCount: 234,
    imageUrl: img1,
  },
  {
    id: "prod-2",
    name: "【18禁動画】シースルー下着コレクション 60分",
    description: "透け透け下着で誘惑...最後まで見せます",
    price: 5800,
    creatorName: "Yua",
    productType: "digital",
    isAvailable: true,
    isPremium: true,
    salesCount: 189,
    imageUrl: img2,
  },
  {
    id: "prod-3",
    name: "【エロASMR】耳舐め＆喘ぎ声60分",
    description: "バイノーラル録音で臨場感MAX",
    price: 1500,
    creatorName: "Mio",
    productType: "digital",
    isAvailable: true,
    isPremium: false,
    salesCount: 456,
    imageUrl: img3,
  },
  {
    id: "prod-4",
    name: "【ヌード写真集】ホテル撮影 完全版",
    description: "プロ撮影の本格ヌードグラビア",
    price: 8900,
    creatorName: "Reina",
    productType: "digital",
    isAvailable: true,
    isPremium: true,
    isLimited: true,
    salesCount: 87,
    imageUrl: img4,
  },
  {
    id: "prod-5",
    name: "【使用済み】私の下着セット",
    description: "直筆サイン＆香り付き",
    price: 4500,
    creatorName: "Hina",
    productType: "physical",
    isAvailable: true,
    isPremium: false,
    salesCount: 156,
    imageUrl: img5,
  },
  {
    id: "prod-6",
    name: "【無修正動画】Tバック撮影 ノーカット版",
    description: "際どすぎて一般公開不可能",
    price: 6500,
    creatorName: "Saki",
    productType: "digital",
    isAvailable: false,
    isPremium: true,
    salesCount: 312,
    imageUrl: img6,
  },
  {
    id: "prod-7",
    name: "【月額プラン】全裸VIPメンバーシップ",
    description: "過激コンテンツ全て見放題",
    price: 9800,
    creatorName: "Aya",
    productType: "digital",
    isAvailable: true,
    isPremium: true,
    salesCount: 523,
    imageUrl: img7,
  },
  {
    id: "prod-8",
    name: "【私物】愛用バイブレーター",
    description: "実際に使っていたアダルトグッズ",
    price: 12000,
    creatorName: "Risa",
    productType: "physical",
    isAvailable: true,
    isPremium: false,
    salesCount: 78,
    imageUrl: img8,
  },
];

export default function Shop() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    postalCode: "",
    address: "",
    phone: "",
  });
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ productId, shipping }: { 
      productId: string; 
      shipping?: { 
        shippingName: string; 
        shippingPostalCode: string; 
        shippingAddress: string; 
        shippingPhone: string; 
      } 
    }) => {
      await apiRequest("POST", `/api/products/${productId}/purchase`, shipping);
    },
    onSuccess: () => {
      setSelectedProduct(null);
      setShippingInfo({ name: "", postalCode: "", address: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "購入完了",
        description: "商品を購入しました。メッセージに詳細が届きます。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "購入に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (product: DemoProduct) => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setSelectedProduct(product);
  };

  const confirmPurchase = () => {
    if (!selectedProduct) return;
    
    if (selectedProduct.productType === "physical") {
      if (!shippingInfo.name || !shippingInfo.postalCode || !shippingInfo.address || !shippingInfo.phone) {
        toast({
          title: "入力エラー",
          description: "配送先情報を入力してください",
          variant: "destructive",
        });
        return;
      }
      purchaseMutation.mutate({
        productId: selectedProduct.id,
        shipping: {
          shippingName: shippingInfo.name,
          shippingPostalCode: shippingInfo.postalCode,
          shippingAddress: shippingInfo.address,
          shippingPhone: shippingInfo.phone,
        },
      });
    } else {
      purchaseMutation.mutate({ productId: selectedProduct.id });
    }
  };

  const displayProducts = products && products.length > 0
    ? products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        price: p.price,
        imageUrl: p.imageUrl || undefined,
        creatorName: "Creator",
        productType: p.productType as "digital" | "physical",
        isAvailable: p.isAvailable ?? true,
      }))
    : demoProducts;

  const filteredProducts = activeTab === "all" 
    ? displayProducts 
    : displayProducts.filter(p => p.productType === activeTab);

  const userPoints = profile?.points || 0;

  return (
    <div className="pb-24 min-h-screen overflow-y-auto scrollbar-hide bg-background">
      <div className="h-14" />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <TabsList className="w-full h-14 bg-transparent rounded-none !inline-flex !justify-start px-4 gap-4">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-4 text-base font-semibold"
              data-testid="tab-all"
            >
              すべて
            </TabsTrigger>
            <TabsTrigger 
              value="digital" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-4 text-base font-semibold"
              data-testid="tab-digital"
            >
              デジタル
            </TabsTrigger>
            <TabsTrigger 
              value="physical" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-4 text-base font-semibold"
              data-testid="tab-physical"
            >
              物販
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0 p-2">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyProductState />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard 
                    {...product} 
                    onPurchase={() => handlePurchase(product as DemoProduct)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>購入確認</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-2">{selectedProduct.name}</p>
                  <p className="text-lg font-bold text-pink-500 mt-1">
                    {selectedProduct.price.toLocaleString()}pt
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">現在の保有ポイント</span>
                  <span className="font-medium">{userPoints.toLocaleString()}pt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">購入後の残高</span>
                  <span className={`font-medium ${userPoints < selectedProduct.price ? "text-destructive" : ""}`}>
                    {(userPoints - selectedProduct.price).toLocaleString()}pt
                  </span>
                </div>
              </div>

              {userPoints < selectedProduct.price && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  ポイントが不足しています。ポイントをチャージしてください。
                </div>
              )}

              {selectedProduct.productType === "physical" && userPoints >= selectedProduct.price && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    配送先情報
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="shipping-name" className="text-xs">お名前 *</Label>
                      <Input
                        id="shipping-name"
                        value={shippingInfo.name}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                        placeholder="山田 太郎"
                        className="h-9"
                        data-testid="input-shipping-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping-postal" className="text-xs">郵便番号 *</Label>
                      <Input
                        id="shipping-postal"
                        value={shippingInfo.postalCode}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                        placeholder="123-4567"
                        className="h-9"
                        data-testid="input-shipping-postal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping-address" className="text-xs">住所 *</Label>
                      <Input
                        id="shipping-address"
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                        placeholder="東京都渋谷区..."
                        className="h-9"
                        data-testid="input-shipping-address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="shipping-phone" className="text-xs">電話番号 *</Label>
                      <Input
                        id="shipping-phone"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                        placeholder="090-1234-5678"
                        className="h-9"
                        data-testid="input-shipping-phone"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              キャンセル
            </Button>
            {userPoints < (selectedProduct?.price || 0) ? (
              <Button onClick={() => setLocation("/points-purchase")}>
                ポイントチャージ
              </Button>
            ) : (
              <Button 
                onClick={confirmPurchase}
                disabled={purchaseMutation.isPending}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {purchaseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                購入する
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
