import { motion } from "framer-motion";
import { 
  ChevronLeft, CreditCard, Plus, Trash2, Loader2, 
  CheckCircle, AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

function getBrandIcon(brand: string) {
  const brandLower = brand.toLowerCase();
  if (brandLower === "visa") return "💳";
  if (brandLower === "mastercard") return "💳";
  if (brandLower === "amex") return "💳";
  if (brandLower === "jcb") return "💳";
  return "💳";
}

function getBrandName(brand: string) {
  const brandLower = brand.toLowerCase();
  if (brandLower === "visa") return "Visa";
  if (brandLower === "mastercard") return "Mastercard";
  if (brandLower === "amex") return "American Express";
  if (brandLower === "jcb") return "JCB";
  return brand;
}

export default function PaymentMethods() {
  const { toast } = useToast();
  const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null);

  const { data: paymentMethods, isLoading, error } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const deleteMethodMutation = useMutation({
    mutationFn: async (methodId: string) => {
      await apiRequest("DELETE", `/api/payment-methods/${methodId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setDeleteMethodId(null);
      toast({ title: "カードを削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (methodId: string) => {
      await apiRequest("POST", `/api/payment-methods/${methodId}/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "デフォルトカードを設定しました" });
    },
    onError: () => {
      toast({ title: "設定に失敗しました", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/account">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-base">お支払い方法</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h3 className="font-bold">カード管理</h3>
                <p className="text-sm text-muted-foreground">
                  ポイント購入時に使用するカードを管理
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold mb-3">登録済みカード</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Card className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">カード情報の取得に失敗しました</p>
            </Card>
          ) : paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                        {getBrandIcon(method.brand)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {getBrandName(method.brand)} •••• {method.last4}
                          </span>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              デフォルト
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          有効期限: {method.expMonth.toString().padStart(2, "0")}/{method.expYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(method.id)}
                          disabled={setDefaultMutation.isPending}
                          data-testid={`button-set-default-${method.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          デフォルト
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteMethodId(method.id)}
                        data-testid={`button-delete-${method.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                登録済みのカードはありません
              </p>
              <p className="text-sm text-muted-foreground">
                ポイント購入時にカードを登録できます
              </p>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/points-purchase">
            <Button className="w-full bg-pink-500" data-testid="button-add-card">
              <Plus className="h-4 w-4 mr-2" />
              新しいカードでポイント購入
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium mb-2">ご利用いただけるカード</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Visa</Badge>
              <Badge variant="outline">Mastercard</Badge>
              <Badge variant="outline">JCB</Badge>
              <Badge variant="outline">American Express</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              カード情報は安全に暗号化され保護されています。
            </p>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={!!deleteMethodId} onOpenChange={() => setDeleteMethodId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カードを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このカードを削除すると、次回購入時に新しいカード情報を入力する必要があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (deleteMethodId) {
                  deleteMethodMutation.mutate(deleteMethodId);
                }
              }}
              disabled={deleteMethodMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMethodMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
