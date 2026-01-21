import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  TrendingUp,
  ShoppingBag,
  Radio,
  Users,
  Wallet,
  Calendar,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface SalesData {
  profile: {
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
  };
  liveEarnings: number;
  productEarnings: number;
  subscriptionEarnings: number;
  recentSales: Array<{
    id: string;
    productName: string;
    amount: number;
    status: string;
    createdAt: string;
    productType: string;
  }>;
}

export default function CreatorSales() {
  const [, setLocation] = useLocation();

  const { data: salesData, isLoading, isError } = useQuery<SalesData>({
    queryKey: ["/api/creator/sales"],
  });

  const formatPoints = (points: number | string) => {
    const num = typeof points === 'string' ? parseInt(points, 10) : points;
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400">完了</Badge>;
      case "shipped":
        return <Badge className="bg-blue-500/20 text-blue-400">発送済み</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-400">処理中</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/account")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">売上管理</h1>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/account")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">売上管理</h1>
          </div>
        </div>
        <div className="p-4">
          <Card className="p-8 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">売上データを取得できませんでした</p>
            <p className="text-sm text-muted-foreground mt-1">クリエイター登録が必要です</p>
          </Card>
        </div>
      </div>
    );
  }

  const totalEarnings = salesData?.profile?.totalEarnings || 0;
  const availableBalance = salesData?.profile?.availableBalance || 0;
  const pendingBalance = salesData?.profile?.pendingBalance || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">売上管理</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-pink-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">振込可能残高</p>
                <p className="text-3xl font-bold text-foreground">{formatPoints(availableBalance)}<span className="text-lg ml-1">pt</span></p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">累計売上</p>
                <p className="text-lg font-semibold">{formatPoints(totalEarnings)} pt</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">振込申請中</p>
                <p className="text-lg font-semibold">{formatPoints(pendingBalance)} pt</p>
              </div>
            </div>
            <Button 
              className="w-full mt-4 bg-pink-500"
              onClick={() => setLocation("/creator-withdrawal")}
              data-testid="button-withdrawal"
            >
              振込申請する
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        </motion.div>

        <div>
          <h2 className="text-lg font-bold mb-3">収益内訳</h2>
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                <p className="text-xs text-muted-foreground mb-1">サブスクプラン</p>
                <p className="text-lg font-bold">{formatPoints(salesData?.subscriptionEarnings || 0)}</p>
                <p className="text-xs text-muted-foreground">pt</p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 text-center">
                <Radio className="h-6 w-6 mx-auto mb-2 text-red-400" />
                <p className="text-xs text-muted-foreground mb-1">ライブ配信</p>
                <p className="text-lg font-bold">{formatPoints(salesData?.liveEarnings || 0)}</p>
                <p className="text-xs text-muted-foreground">pt</p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 text-center">
                <ShoppingBag className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                <p className="text-xs text-muted-foreground mb-1">SHOP</p>
                <p className="text-lg font-bold">{formatPoints(salesData?.productEarnings || 0)}</p>
                <p className="text-xs text-muted-foreground">pt</p>
              </Card>
            </motion.div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">最近の売上</h2>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {salesData?.recentSales && salesData.recentSales.length > 0 ? (
            <div className="space-y-3">
              {salesData.recentSales.map((sale, index) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{sale.productName || "商品"}</p>
                          {getStatusBadge(sale.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {sale.createdAt ? format(new Date(sale.createdAt), "yyyy/MM/dd HH:mm", { locale: ja }) : "-"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {sale.productType === "digital" ? "デジタル" : "物販"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-pink-400">+{formatPoints(sale.amount || 0)}</p>
                        <p className="text-xs text-muted-foreground">pt</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">まだ売上がありません</p>
              <p className="text-sm text-muted-foreground mt-1">商品を販売したり配信を始めると、ここに売上が表示されます</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
