import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Package, 
  Download, 
  ExternalLink,
  ShoppingBag,
  Truck,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MyPurchasesPage() {
  const [, setLocation] = useLocation();

  const { data: purchases, isLoading } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
  });

  const digitalPurchases = purchases?.filter(p => p.product?.productType === "digital") || [];
  const physicalPurchases = purchases?.filter(p => p.product?.productType === "physical") || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">購入履歴</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : purchases?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">まだ購入履歴がありません</p>
            <Button onClick={() => setLocation("/shop")} data-testid="button-browse-shop">
              ショップを見る
            </Button>
          </div>
        ) : (
          <>
            {digitalPurchases.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  デジタルコンテンツ
                </h2>
                <div className="space-y-3">
                  {digitalPurchases.map((purchase) => (
                    <motion.div
                      key={purchase.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-4">
                        <div className="flex gap-4">
                          {purchase.product?.imageUrl ? (
                            <img
                              src={purchase.product.imageUrl}
                              alt={purchase.product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate" data-testid={`text-product-name-${purchase.id}`}>
                              {purchase.product?.name || "削除された商品"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(purchase.createdAt), "yyyy年M月d日", { locale: ja })}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              {purchase.price.toLocaleString()} pt
                            </p>
                            {purchase.product?.contentUrl && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => window.open(purchase.product?.contentUrl, "_blank")}
                                data-testid={`button-access-content-${purchase.id}`}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                コンテンツを見る
                              </Button>
                            )}
                          </div>
                          <Badge variant="secondary" className="shrink-0 h-fit">
                            デジタル
                          </Badge>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {physicalPurchases.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  配送商品
                </h2>
                <div className="space-y-3">
                  {physicalPurchases.map((purchase) => (
                    <motion.div
                      key={purchase.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-4">
                        <div className="flex gap-4">
                          {purchase.product?.imageUrl ? (
                            <img
                              src={purchase.product.imageUrl}
                              alt={purchase.product.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate" data-testid={`text-product-name-${purchase.id}`}>
                              {purchase.product?.name || "削除された商品"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(purchase.createdAt), "yyyy年M月d日", { locale: ja })}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              {purchase.price.toLocaleString()} pt
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {purchase.status === "completed" ? "配送完了" : 
                                 purchase.status === "shipped" ? "配送中" : "処理中"}
                              </span>
                            </div>
                            {purchase.shippingAddress && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                配送先: {purchase.shippingAddress}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0 h-fit">
                            物販
                          </Badge>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
