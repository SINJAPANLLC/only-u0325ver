import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Building2, Star, Check, Info, Copy, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PointPackage, UserProfile, BankTransferRequest } from "@shared/schema";

const TAX_RATE = 0.10;

const DEFAULT_PACKAGES = [
  { id: "1", points: 500, priceExcludingTax: 545, taxAmount: 55, priceIncludingTax: 600, bonusPoints: 0 },
  { id: "2", points: 1000, priceExcludingTax: 1091, taxAmount: 109, priceIncludingTax: 1200, bonusPoints: 0 },
  { id: "3", points: 3000, priceExcludingTax: 3273, taxAmount: 327, priceIncludingTax: 3600, bonusPoints: 0 },
  { id: "4", points: 5000, priceExcludingTax: 5455, taxAmount: 545, priceIncludingTax: 6000, bonusPoints: 0 },
  { id: "5", points: 10000, priceExcludingTax: 10909, taxAmount: 1091, priceIncludingTax: 12000, bonusPoints: 0 },
  { id: "6", points: 30000, priceExcludingTax: 32727, taxAmount: 3273, priceIncludingTax: 36000, bonusPoints: 0 },
  { id: "7", points: 50000, priceExcludingTax: 54545, taxAmount: 5455, priceIncludingTax: 60000, bonusPoints: 0 },
  { id: "8", points: 100000, priceExcludingTax: 109091, taxAmount: 10909, priceIncludingTax: 120000, bonusPoints: 0 },
];

const BANK_INFO = {
  bankName: "相愛信用組合（2318）",
  branchName: "本店（003）",
  accountType: "普通",
  accountNumber: "0172246",
  accountName: "ゴウドウガイシャシンジャパンカナガワ",
};

type PaymentMethod = "card" | "bank";
type Step = "select" | "payment" | "bank_info" | "complete";
type PackageType = { id: string; points: number; priceExcludingTax: number; taxAmount: number; priceIncludingTax: number; bonusPoints: number | null };

export default function PointsPurchase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState<Step>("select");
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [pendingTransfer, setPendingTransfer] = useState<BankTransferRequest | null>(null);

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const { data: packages } = useQuery<PointPackage[]>({
    queryKey: ["/api/point-packages"],
  });

  const createBankTransferMutation = useMutation({
    mutationFn: async (packageData: PackageType) => {
      const response = await apiRequest("POST", "/api/bank-transfer-requests", {
        points: packageData.points,
        amount: packageData.priceIncludingTax,
        amountExcludingTax: packageData.priceExcludingTax,
        taxAmount: packageData.taxAmount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setPendingTransfer(data);
      setStep("bank_info");
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transfer-requests"] });
    },
    onError: () => {
      toast({ title: "申請に失敗しました", variant: "destructive" });
    },
  });

  const displayPackages = packages?.length ? packages : DEFAULT_PACKAGES;

  const handleSelectPackage = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setStep("payment");
  };

  const handlePayment = () => {
    if (!selectedPackage) return;

    if (paymentMethod === "card") {
      toast({ title: "カード決済の設定が必要です", description: "管理者にStripe統合の設定を依頼してください" });
    } else {
      createBankTransferMutation.mutate(selectedPackage);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label}をコピーしました` });
  };

  const formatDeadline = (date: Date | string | null) => {
    if (!date) return "7日以内";
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日まで`;
  };

  if (step === "bank_info" && pendingTransfer) {
    return (
      <div className="pb-20 overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/account")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">振込情報</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold">振込申請を受け付けました</h2>
                  <p className="text-sm text-muted-foreground">以下の口座にお振込みください</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">振込期限: {formatDeadline(pendingTransfer.transferDeadline)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">銀行名</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{BANK_INFO.bankName}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(BANK_INFO.bankName, "銀行名")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">支店名</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{BANK_INFO.branchName}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(BANK_INFO.branchName, "支店名")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">口座種別</span>
                  <span className="font-medium">{BANK_INFO.accountType}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">口座番号</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{BANK_INFO.accountNumber}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(BANK_INFO.accountNumber, "口座番号")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">口座名義</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{BANK_INFO.accountName}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(BANK_INFO.accountName, "口座名義")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ポイント</span>
                  <span>¥{pendingTransfer.points.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">購入手数料（10%）</span>
                  <span>¥{Math.floor(pendingTransfer.points * 0.1).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">消費税（10%）</span>
                  <span>¥{Math.floor(pendingTransfer.points * 0.1).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>振込金額（税込）</span>
                  <span className="text-pink-600 dark:text-pink-400">¥{pendingTransfer.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p>お振込みを確認次第、ポイントが付与されます。確認には1〜3営業日かかる場合があります。</p>
                    <p className="mt-2">振込人名義は登録氏名と一致させてください。</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <Button 
            className="w-full" 
            onClick={() => setLocation("/account")}
            data-testid="button-done"
          >
            完了
          </Button>
        </div>
      </div>
    );
  }

  if (step === "payment" && selectedPackage) {
    return (
      <div className="pb-20 overflow-y-auto scrollbar-hide">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setStep("select")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">お支払い方法</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">pt</span>
                  </div>
                  <div>
                    <p className="font-bold text-lg text-pink-600 dark:text-pink-400">{selectedPackage.points.toLocaleString()} pt</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">¥{selectedPackage.priceIncludingTax.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">税込</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <Card className="p-4">
            <h3 className="font-bold mb-4">お支払い方法を選択</h3>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                <RadioGroupItem value="card" id="card" data-testid="radio-card" />
                <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">クレジットカード</p>
                    <p className="text-xs text-muted-foreground">VISA / Mastercard / JCB / AMEX</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                <RadioGroupItem value="bank" id="bank" data-testid="radio-bank" />
                <Label htmlFor="bank" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">銀行振込</p>
                    <p className="text-xs text-muted-foreground">入金確認後にポイント付与</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-3">お支払い内容</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ポイント</span>
                <span>¥{selectedPackage.points.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">購入手数料（10%）</span>
                <span>¥{Math.floor(selectedPackage.points * 0.1).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">消費税（10%）</span>
                <span>¥{Math.floor(selectedPackage.points * 0.1).toLocaleString()}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>合計（税込）</span>
                <span className="text-pink-600 dark:text-pink-400">¥{selectedPackage.priceIncludingTax.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Button 
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500" 
            size="lg"
            onClick={handlePayment}
            disabled={createBankTransferMutation.isPending}
            data-testid="button-confirm-payment"
          >
            {createBankTransferMutation.isPending ? "処理中..." : 
              paymentMethod === "card" ? "カード決済に進む" : "振込情報を確認"
            }
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 overflow-y-auto scrollbar-hide">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Link href="/account">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">ポイント購入</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">pt</span>
                </div>
                <div>
                  <p className="text-sm text-pink-600 dark:text-pink-400">現在の保有ポイント</p>
                  <p className="text-2xl font-bold" data-testid="text-current-points">
                    {(profile?.points ?? 0).toLocaleString()} pt
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400">
          <Info className="h-4 w-4" />
          <span>1ポイント = 1.2円（税込）</span>
        </div>

        <h2 className="font-bold text-lg">ポイントパッケージを選択</h2>

        <div className="grid grid-cols-2 gap-3">
          {displayPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="p-4 cursor-pointer hover-elevate relative overflow-visible"
                onClick={() => handleSelectPackage(pkg)}
                data-testid={`card-package-${pkg.points}`}
              >
                                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className="text-xl font-bold text-pink-600 dark:text-pink-400">{pkg.points.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-pink-500 dark:text-pink-400">ポイント</p>
                  <Separator className="my-2" />
                  <p className="font-bold text-pink-600 dark:text-pink-400">¥{pkg.priceIncludingTax.toLocaleString()}</p>
                  <p className="text-xs text-pink-500 dark:text-pink-400">税込</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-4 bg-muted/50">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            ご利用について
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ポイントは購入後すぐにご利用いただけます（銀行振込を除く）</li>
            <li>• 銀行振込の場合、入金確認後にポイントが付与されます</li>
            <li>• ポイントの有効期限は最終利用日から1年間です</li>
            <li>• 購入したポイントの返金・換金はできません</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
