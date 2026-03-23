import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, Check, Truck, Heart } from "lucide-react";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Product, UserProfile } from "@shared/schema";

import img1 from "@assets/generated_images/nude_bedroom_1.jpg";
import img2 from "@assets/generated_images/nude_bath_2.jpg";
import img3 from "@assets/generated_images/lingerie_bed_3.jpg";
import img4 from "@assets/generated_images/nude_shower_4.jpg";
import img5 from "@assets/generated_images/bunny_girl_5.jpg";
import img6 from "@assets/generated_images/micro_bikini_6.jpg";
import img7 from "@assets/generated_images/sexy_maid_7.jpg";
import img8 from "@assets/generated_images/topless_morning_8.jpg";

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
  isDemo?: boolean;
}

const demoProducts: DemoProduct[] = [
  { id: "prod-1", name: "【過激写真集】全裸ギリギリショット 100枚", description: "モザイク無し・修正無しの限界ショット", price: 3500, originalPrice: 5000, creatorName: "Risa", productType: "digital", isAvailable: true, isLimited: true, salesCount: 234, imageUrl: img1, isDemo: true },
  { id: "prod-2", name: "【18禁動画】シースルー下着コレクション 60分", description: "透け透け下着で誘惑...最後まで見せます", price: 5800, creatorName: "Yua", productType: "digital", isAvailable: true, isPremium: true, salesCount: 189, imageUrl: img2, isDemo: true },
  { id: "prod-3", name: "【エロASMR】耳舐め＆喘ぎ声60分", description: "バイノーラル録音で臨場感MAX", price: 1500, creatorName: "Mio", productType: "digital", isAvailable: true, salesCount: 456, imageUrl: img3, isDemo: true },
  { id: "prod-4", name: "【ヌード写真集】ホテル撮影 完全版", description: "プロ撮影の本格ヌードグラビア", price: 8900, creatorName: "Reina", productType: "digital", isAvailable: true, isPremium: true, isLimited: true, salesCount: 87, imageUrl: img4, isDemo: true },
  { id: "prod-5", name: "【使用済み】私の下着セット", description: "直筆サイン＆香り付き", price: 4500, creatorName: "Hina", productType: "physical", isAvailable: true, salesCount: 156, imageUrl: img5, isDemo: true },
  { id: "prod-6", name: "【無修正動画】Tバック撮影 ノーカット版", description: "際どすぎて一般公開不可能", price: 6500, creatorName: "Saki", productType: "digital", isAvailable: false, isPremium: true, salesCount: 312, imageUrl: img6, isDemo: true },
  { id: "prod-7", name: "【月額プラン】全裸VIPメンバーシップ", description: "過激コンテンツ全て見放題", price: 9800, creatorName: "Aya", productType: "digital", isAvailable: true, isPremium: true, salesCount: 523, imageUrl: img7, isDemo: true },
  { id: "prod-8", name: "【私物】愛用バイブレーター", description: "実際に使っていたアダルトグッズ", price: 12000, creatorName: "Risa", productType: "physical", isAvailable: true, salesCount: 78, imageUrl: img8, isDemo: true },
];

interface ProductCardProps {
  product: DemoProduct;
  onBuy: () => void;
}

function ProductCard({ product, onBuy }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(product.salesCount || 0);

  return (
    <div className="w-full h-full relative bg-black">
      <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

      {/* Sold out overlay */}
      {!product.isAvailable && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <Badge variant="secondary" className="text-base px-6 py-3">SOLD OUT</Badge>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-3 bottom-[100px] z-20 flex flex-col items-center gap-5">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center ring-2 ring-white shadow-xl">
          <span className="text-white font-bold text-sm">{product.creatorName.charAt(0)}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(p => { setLikeCount(c => p ? c - 1 : c + 1); return !p; }); }}
          className="flex flex-col items-center gap-1"
          data-testid={`button-like-${product.id}`}
        >
          <motion.div whileTap={{ scale: 1.3 }} className="h-11 w-11 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md shadow-lg">
            <Heart className={`h-6 w-6 transition-colors drop-shadow ${liked ? "text-pink-400 fill-pink-400" : "text-white"}`} />
          </motion.div>
          <span className="text-[11px] text-white font-bold drop-shadow">{likeCount >= 1000 ? `${(likeCount/1000).toFixed(1)}K` : likeCount}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (product.isAvailable) onBuy(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`button-buy-${product.id}`}
        >
          <motion.div whileTap={{ scale: 1.1 }} className="h-11 w-11 rounded-full flex items-center justify-center bg-pink-500 shadow-lg">
            <ShoppingBag className="h-5 w-5 text-white" />
          </motion.div>
          <span className="text-[11px] text-white font-bold drop-shadow">購入</span>
        </button>
      </div>

      {/* Bottom info — username, title, price */}
      <div className="absolute bottom-24 left-4 right-20 z-20">
        <p className="text-white/80 font-semibold text-sm drop-shadow mb-1">@{product.creatorName}</p>
        <p className="text-white font-bold text-base drop-shadow leading-snug mb-2 line-clamp-2">{product.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-pink-400 font-bold text-lg drop-shadow">{product.price.toLocaleString()}pt</span>
          {product.originalPrice && (
            <span className="text-white/50 text-sm line-through">{product.originalPrice.toLocaleString()}pt</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const [activeTab, setActiveTab] = useState<"all" | "digital" | "physical">("all");
  const [index, setIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<DemoProduct | null>(null);
  const [shippingInfo, setShippingInfo] = useState({ name: "", postalCode: "", address: "", phone: "" });
  const locked = useRef(false);
  const startY = useRef(0);
  const indexRef = useRef(0);
  const lengthRef = useRef(0);

  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: products } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: profile } = useQuery<UserProfile>({ queryKey: ["/api/profile"], enabled: !!user });

  const purchaseMutation = useMutation({
    mutationFn: async ({ productId, shipping }: { productId: string; shipping?: { shippingName: string; shippingPostalCode: string; shippingAddress: string; shippingPhone: string } }) => {
      await apiRequest("POST", `/api/products/${productId}/purchase`, shipping);
    },
    onSuccess: () => {
      setSelectedProduct(null);
      setShippingInfo({ name: "", postalCode: "", address: "", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "購入完了", description: "商品を購入しました。" });
    },
    onError: (error: any) => {
      toast({ title: "エラー", description: error.message || "購入に失敗しました", variant: "destructive" });
    },
  });

  const handleBuy = (product: DemoProduct) => {
    if (!user) { setLocation("/auth"); return; }
    setSelectedProduct(product);
  };

  const confirmPurchase = () => {
    if (!selectedProduct) return;
    if (selectedProduct.productType === "physical") {
      if (!shippingInfo.name || !shippingInfo.postalCode || !shippingInfo.address || !shippingInfo.phone) {
        toast({ title: "入力エラー", description: "配送先情報を入力してください", variant: "destructive" });
        return;
      }
      purchaseMutation.mutate({ productId: selectedProduct.id, shipping: { shippingName: shippingInfo.name, shippingPostalCode: shippingInfo.postalCode, shippingAddress: shippingInfo.address, shippingPhone: shippingInfo.phone } });
    } else {
      purchaseMutation.mutate({ productId: selectedProduct.id });
    }
  };

  const allProducts: DemoProduct[] = products && products.length > 0
    ? products.map((p: any) => ({ id: p.id, name: p.name, description: p.description || "", price: p.price, imageUrl: p.imageUrl || img1, creatorName: p.creatorDisplayName || "Creator", productType: p.productType as "digital" | "physical", isAvailable: p.isAvailable ?? true, isDemo: false }))
    : demoProducts;

  const displayProducts = activeTab === "all" ? allProducts : allProducts.filter(p => p.productType === activeTab);

  // Reset index when tab changes
  useEffect(() => { setIndex(0); }, [activeTab]);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { lengthRef.current = displayProducts.length; }, [displayProducts.length]);

  // Wheel
  useEffect(() => {
    const el = document.getElementById("shop-feed");
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (locked.current) return;
      if (Math.abs(e.deltaY) < 30) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const next = indexRef.current + dir;
      if (next < 0 || next >= lengthRef.current) return;
      locked.current = true;
      setIndex(next);
      setTimeout(() => { locked.current = false; }, 900);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const navigate = (dir: 1 | -1) => {
    if (locked.current) return;
    const next = index + dir;
    if (next < 0 || next >= displayProducts.length) return;
    locked.current = true;
    setIndex(next);
    setTimeout(() => { locked.current = false; }, 900);
  };

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dy = startY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
  };

  const userPoints = profile?.points || 0;

  return (
    <>
      {/* Logo overlay — top left (mobile only) */}
      <div className="fixed top-0 left-0 z-40 flex items-center px-3 h-14 pointer-events-none pt-safe lg:hidden">
        <img src={logoImage} alt="Only-U" className="h-16 object-contain brightness-0 invert" />
      </div>

      {/* Tab filter — top right corner */}
      <div className="fixed top-4 right-3 z-40 flex gap-1 bg-black/50 backdrop-blur-md rounded-full px-2 py-1.5">
        {(["all", "digital", "physical"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${activeTab === tab ? "bg-pink-500 text-white" : "text-white/70"}`}
            data-testid={`tab-${tab}`}
          >
            {tab === "all" ? "すべて" : tab === "digital" ? "デジタル" : "物販"}
          </button>
        ))}
      </div>

      <div
        id="shop-feed"
        className="h-[100svh] overflow-hidden bg-black flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {displayProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white gap-4">
            <ShoppingBag className="h-16 w-16 text-white/30" />
            <p className="text-white/60">商品がありません</p>
          </div>
        ) : (
          <div className="w-full h-full lg:max-w-[420px] lg:mx-auto relative overflow-hidden">
            <div
              style={{
                transform: `translateY(calc(-${index} * 100%))`,
                transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                willChange: "transform",
                height: "100%",
              }}
            >
              {displayProducts.map((product) => (
                <div key={product.id} style={{ height: "100%", width: "100%", position: "relative" }} data-testid={`card-product-${product.id}`}>
                  <ProductCard product={product} onBuy={() => handleBuy(product)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Purchase Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.isDemo ? "デモ商品" : "購入確認"}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-16 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-sm line-clamp-2">{selectedProduct.name}</p>
                  <p className="text-lg font-bold text-pink-500 mt-1">{selectedProduct.price.toLocaleString()}pt</p>
                </div>
              </div>

              {selectedProduct.isDemo ? (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-white/50">これはサンプル表示用のデモ商品です。実際の商品はクリエイターが出品した際に購入できます。</p>
                </div>
              ) : (
                <>
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">現在の保有ポイント</span>
                      <span className="font-medium">{userPoints.toLocaleString()}pt</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">購入後の残高</span>
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
                </>
              )}

              {!selectedProduct.isDemo && selectedProduct.productType === "physical" && userPoints >= selectedProduct.price && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-white/50">
                    <Truck className="h-4 w-4" />配送先情報
                  </div>
                  <div className="space-y-3">
                    <div><Label className="text-xs">お名前 *</Label><Input value={shippingInfo.name} onChange={e => setShippingInfo({ ...shippingInfo, name: e.target.value })} placeholder="山田 太郎" className="h-9" data-testid="input-shipping-name" /></div>
                    <div><Label className="text-xs">郵便番号 *</Label><Input value={shippingInfo.postalCode} onChange={e => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })} placeholder="123-4567" className="h-9" data-testid="input-shipping-postal" /></div>
                    <div><Label className="text-xs">住所 *</Label><Input value={shippingInfo.address} onChange={e => setShippingInfo({ ...shippingInfo, address: e.target.value })} placeholder="東京都渋谷区..." className="h-9" data-testid="input-shipping-address" /></div>
                    <div><Label className="text-xs">電話番号 *</Label><Input value={shippingInfo.phone} onChange={e => setShippingInfo({ ...shippingInfo, phone: e.target.value })} placeholder="090-1234-5678" className="h-9" data-testid="input-shipping-phone" /></div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              {selectedProduct?.isDemo ? "閉じる" : "キャンセル"}
            </Button>
            {!selectedProduct?.isDemo && (
              userPoints < (selectedProduct?.price || 0) ? (
                <Button onClick={() => setLocation("/points-purchase")}>ポイントチャージ</Button>
              ) : (
                <Button onClick={confirmPurchase} disabled={purchaseMutation.isPending} className="bg-pink-500 hover:bg-pink-600">
                  {purchaseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  購入する
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
