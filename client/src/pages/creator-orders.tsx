import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  Package, 
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Order = {
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
    imageUrl?: string;
    productType: string;
  };
  buyer?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function CreatorOrdersPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/creator-orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/creator-orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator-orders"] });
      toast({ title: "ステータスを更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const physicalOrders = orders?.filter(o => o.product?.productType === "physical") || [];
  const digitalOrders = orders?.filter(o => o.product?.productType === "digital") || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />未発送</Badge>;
      case "shipped":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Truck className="h-3 w-3 mr-1" />発送済み</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />完了</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
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
          <h1 className="text-lg font-semibold">注文管理</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : orders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">まだ注文がありません</p>
          </div>
        ) : (
          <>
            {physicalOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  要発送 ({physicalOrders.filter(o => o.status === "pending").length})
                </h2>
                <div className="space-y-3">
                  {physicalOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-4">
                        <div className="flex gap-4 mb-3">
                          {order.product?.imageUrl ? (
                            <img
                              src={order.product.imageUrl}
                              alt={order.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium truncate" data-testid={`text-order-product-${order.id}`}>
                                {order.product?.name || "削除された商品"}
                              </h3>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(order.createdAt), "yyyy年M月d日 HH:mm", { locale: ja })}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              {order.price.toLocaleString()} pt
                            </p>
                          </div>
                        </div>

                        <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{order.shippingName || "名前なし"}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p>〒{order.shippingPostalCode}</p>
                              <p>{order.shippingAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{order.shippingPhone}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-sm text-muted-foreground">ステータス:</span>
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                          >
                            <SelectTrigger className="w-32 h-8" data-testid={`select-status-${order.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">未発送</SelectItem>
                              <SelectItem value="shipped">発送済み</SelectItem>
                              <SelectItem value="completed">完了</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {digitalOrders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  デジタル販売 ({digitalOrders.length})
                </h2>
                <div className="space-y-3">
                  {digitalOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-4">
                        <div className="flex gap-4">
                          {order.product?.imageUrl ? (
                            <img
                              src={order.product.imageUrl}
                              alt={order.product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium truncate">
                                {order.product?.name || "削除された商品"}
                              </h3>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />完了
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(order.createdAt), "yyyy年M月d日 HH:mm", { locale: ja })}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              {order.price.toLocaleString()} pt
                            </p>
                          </div>
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
