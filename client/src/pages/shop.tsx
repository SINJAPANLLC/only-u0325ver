import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, Check, Truck, Heart, Package } from "lucide-react";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { UserProfile } from "@shared/schema";

interface ShopProduct {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  price: number;
  productType: "digital" | "physical";
  imageUrl: string | null;
  isAvailable: boolean;
  creatorDisplayName: string | null;
  creatorAvatarUrl: string | null;
  creatorUsername: string | null;
  stock: number | null;
}

function ProductCard({ product, onBuy, onCreatorClick }: { product: ShopProduct; onBuy: () => void; onCreatorClick: () => void }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  return (
    <div className="w-full h-full relative bg-zinc-900 flex-shrink-0">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black flex items-center justify-center">
          <Package className="h-24 w-24 text-white/10" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />

      {!product.isAvailable && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <Badge variant="secondary" className="text-base px-6 py-3">SOLD OUT</Badge>
        </div>
      )}

      <div className="absolute right-3 bottom-[110px] z-20 flex flex-col items-center gap-5">
        <button
          onClick={(e) => { e.stopPropagation(); onCreatorClick(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`button-creator-${product.id}`}
        >
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-xl">
            <AvatarImage src={product.creatorAvatarUrl || undefined} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold text-sm">
              {(product.creatorDisplayName || "?").charAt(0)}
            </AvatarFallback>
          </Avatar>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked(p => { setLikeCount(c => p ? c - 1 : c + 1); return !p; });
          }}
          className="flex flex-col items-center gap-1"
          data-testid={`button-like-${product.id}`}
        >
          <motion.div whileTap={{ scale: 1.3 }} className="h-11 w-11 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-md shadow-lg">
            <Heart className={`h-6 w-6 transition-colors drop-shadow ${liked ? "text-pink-400 fill-pink-400" : "text-white"}`} />
          </motion.div>
          <span className="text-[11px] text-white font-bold drop-shadow">{likeCount}</span>
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

      <div className="absolute bottom-24 left-4 right-20 z-20">
        <p className="text-white/70 text-xs font-medium drop-shadow mb-1">
          @{product.creatorUsername || product.creatorDisplayName || "creator"}
        </p>
        <p className="text-white font-bold text-base drop-shadow leading-snug mb-2 line-clamp-2">
          {product.name}
        </p>
        <span className="text-pink-400 font-bold text-lg drop-shadow">
          {product.price.toLocaleString()}pt
        </span>
      </div>
    </div>
  );
}

export default function Shop() {
  const [activeTab, setActiveTab] = useState<"all" | "digital" | "physical">("all");
  const [index, setIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [shippingInfo, setShippingInfo] = useState({ name: "", postalCode: "", address: "", phone: "" });
  const locked = useRef(false);
  const startY = useRef(0);
  const indexRef = useRef(0);
  const lengthRef = useRef(0);

  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: allProductsData = [], isLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/products"],
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ productId, shipping }: {
      productId: string;
      shipping?: { shippingName: string; shippingPostalCode: string; shippingAddress: string; shippingPhone: string };
    }) => {
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

  const displayProducts = activeTab === "all"
    ? allProductsData
    : allProductsData.filter(p => p.productType === activeTab);

  useEffect(() => { setIndex(0); }, [activeTab]);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { lengthRef.current = displayProducts.length; }, [displayProducts.length]);

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

  const handleBuy = (product: ShopProduct) => {
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

  const userPoints = profile?.points || 0;

  return (
    <>
      <div className="fixed top-0 left-0 z-40 flex items-center px-3 h-14 pointer-events-none pt-safe lg:hidden">
        <img src={logoImage} alt="Only-U" className="h-16 object-contain brightness-0 invert" />
      </div>

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
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500/60" />
            <p className="text-white/40 text-sm">読み込み中...</p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/5 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-white/20" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">商品がありません</p>
              <p className="text-white/40 text-sm">クリエイターが商品を出品するとここに表示されます</p>
            </div>
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
                <div
                  key={product.id}
                  style={{ height: "100%", width: "100%", position: "relative" }}
                  data-testid={`card-product-${product.id}`}
                >
                  <ProductCard
                    product={product}
                    onBuy={() => handleBuy(product)}
                    onCreatorClick={() => setLocation(`/creator/${product.creatorId}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-sm rounded-2xl bg-zinc-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">購入確認</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-7 w-7 text-white/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2 text-white">{selectedProduct.name}</p>
                  <p className="text-lg font-bold text-pink-400 mt-1">{selectedProduct.price.toLocaleString()}pt</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">現在の保有ポイント</span>
                  <span className="font-medium text-white">{userPoints.toLocaleString()}pt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">購入後の残高</span>
                  <span className={`font-medium ${userPoints < selectedProduct.price ? "text-red-400" : "text-white"}`}>
                    {(userPoints - selectedProduct.price).toLocaleString()}pt
                  </span>
                </div>
              </div>

              {userPoints < selectedProduct.price && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm">
                  ポイントが不足しています。
                </div>
              )}

              {selectedProduct.productType === "physical" && userPoints >= selectedProduct.price && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-white/40">
                    <Truck className="h-3.5 w-3.5" />配送先情報
                  </div>
                  <div className="space-y-2.5">
                    <div><Label className="text-xs text-white/60">お名前 *</Label><Input value={shippingInfo.name} onChange={e => setShippingInfo({ ...shippingInfo, name: e.target.value })} placeholder="山田 太郎" className="h-9 mt-0.5 bg-white/5 border-white/10 text-white" data-testid="input-shipping-name" /></div>
                    <div><Label className="text-xs text-white/60">郵便番号 *</Label><Input value={shippingInfo.postalCode} onChange={e => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })} placeholder="123-4567" className="h-9 mt-0.5 bg-white/5 border-white/10 text-white" data-testid="input-shipping-postal" /></div>
                    <div><Label className="text-xs text-white/60">住所 *</Label><Input value={shippingInfo.address} onChange={e => setShippingInfo({ ...shippingInfo, address: e.target.value })} placeholder="東京都渋谷区..." className="h-9 mt-0.5 bg-white/5 border-white/10 text-white" data-testid="input-shipping-address" /></div>
                    <div><Label className="text-xs text-white/60">電話番号 *</Label><Input value={shippingInfo.phone} onChange={e => setShippingInfo({ ...shippingInfo, phone: e.target.value })} placeholder="090-1234-5678" className="h-9 mt-0.5 bg-white/5 border-white/10 text-white" data-testid="input-shipping-phone" /></div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSelectedProduct(null)} className="text-white/60">
              キャンセル
            </Button>
            {userPoints < (selectedProduct?.price || 0) ? (
              <Button onClick={() => setLocation("/points-purchase")} className="bg-pink-500 hover:bg-pink-600">
                ポイントチャージ
              </Button>
            ) : (
              <Button onClick={confirmPurchase} disabled={purchaseMutation.isPending} className="bg-pink-500 hover:bg-pink-600">
                {purchaseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                購入する
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
