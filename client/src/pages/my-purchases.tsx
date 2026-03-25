import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Download,
  ExternalLink,
  ShoppingBag,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Purchase = {
  id: string;
  userId: string;
  productId: string;
  creatorId: string;
  price: number;
  status: string;
  createdAt: string;
  shippingName?: string;
  shippingPostalCode?: string;
  shippingAddress?: string;
  shippingPhone?: string;
  product?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    contentUrl?: string;
    productType: string;
    stock?: number;
    isAvailable?: boolean;
  };
};

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
        <CheckCircle className="h-3 w-3" />完了
      </span>
    );
  }
  if (status === "shipped") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
        <Truck className="h-3 w-3" />配送中
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-white/50">
      <Clock className="h-3 w-3" />処理中
    </span>
  );
}

export default function MyPurchasesPage() {
  const [, setLocation] = useLocation();

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const digitalPurchases = purchases?.filter(p => p.product?.productType === "digital") || [];
  const physicalPurchases = purchases?.filter(p => p.product?.productType === "physical") || [];
  const otherPurchases = purchases?.filter(
    p => !p.product || (p.product.productType !== "digital" && p.product.productType !== "physical")
  ) || [];

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10 flex-shrink-0">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-base">購入履歴</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
                <div className="h-20 w-20 rounded-xl bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded-lg w-3/4" />
                  <div className="h-3 bg-white/10 rounded-lg w-1/2" />
                  <div className="h-3 bg-white/10 rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : purchases?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-5">
              <ShoppingBag className="h-10 w-10 text-pink-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">購入履歴がありません</h3>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-6">
              ショップでコンテンツや商品を購入してみましょう
            </p>
            <Button
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl px-6"
              onClick={() => setLocation("/shop")}
              data-testid="button-browse-shop"
            >
              ショップを見る
            </Button>
          </motion.div>
        ) : (
          <>
            {digitalPurchases.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Download className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h2 className="font-bold text-sm">デジタルコンテンツ</h2>
                  <span className="text-xs text-white/50">{digitalPurchases.length}件</span>
                </div>
                <div className="space-y-2">
                  {digitalPurchases.map((purchase, index) => (
                    <motion.div
                      key={purchase.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      {purchase.product?.imageUrl ? (
                        <img
                          src={purchase.product.imageUrl}
                          alt={purchase.product.name}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Download className="h-8 w-8 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" data-testid={`text-product-name-${purchase.id}`}>
                          {purchase.product?.name || "削除された商品"}
                        </h3>
                        <p className="text-xs text-white/50 mb-1">
                          {format(new Date(purchase.createdAt), "yyyy年M月d日", { locale: ja })}
                        </p>
                        <p className="text-sm font-bold text-pink-500">
                          {purchase.price.toLocaleString()}pt
                        </p>
                        {purchase.product?.contentUrl && (
                          <Button
                            size="sm"
                            className="mt-2 h-7 px-3 rounded-lg text-xs bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                            onClick={() => window.open(purchase.product?.contentUrl, "_blank")}
                            data-testid={`button-access-content-${purchase.id}`}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            コンテンツを見る
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {physicalPurchases.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Truck className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h2 className="font-bold text-sm">配送商品</h2>
                  <span className="text-xs text-white/50">{physicalPurchases.length}件</span>
                </div>
                <div className="space-y-2">
                  {physicalPurchases.map((purchase, index) => (
                    <motion.div
                      key={purchase.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      {purchase.product?.imageUrl ? (
                        <img
                          src={purchase.product.imageUrl}
                          alt={purchase.product.name}
                          className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="h-8 w-8 text-orange-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" data-testid={`text-product-name-${purchase.id}`}>
                          {purchase.product?.name || "削除された商品"}
                        </h3>
                        <p className="text-xs text-white/50 mb-1">
                          {format(new Date(purchase.createdAt), "yyyy年M月d日", { locale: ja })}
                        </p>
                        <p className="text-sm font-bold text-pink-500 mb-1">
                          {purchase.price.toLocaleString()}pt
                        </p>
                        <StatusBadge status={purchase.status} />
                        {purchase.shippingAddress && (
                          <p className="text-[11px] text-white/30 mt-0.5 truncate">
                            {purchase.shippingAddress}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {otherPurchases.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h2 className="font-bold text-sm">その他の購入</h2>
                  <span className="text-xs text-white/50">{otherPurchases.length}件</span>
                </div>
                <div className="space-y-2">
                  {otherPurchases.map((purchase, index) => (
                    <motion.div
                      key={purchase.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" data-testid={`text-product-name-${purchase.id}`}>
                          {purchase.product?.name || "削除された商品"}
                        </h3>
                        <p className="text-xs text-white/50 mb-1">
                          {format(new Date(purchase.createdAt), "yyyy年M月d日", { locale: ja })}
                        </p>
                        <p className="text-sm font-bold text-pink-500 mb-1">
                          {purchase.price.toLocaleString()}pt
                        </p>
                        <StatusBadge status={purchase.status} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
