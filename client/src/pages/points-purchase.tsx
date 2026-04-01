import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Building2, Star, Check, Info, Copy, Clock, Loader2 } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
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
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

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
type Step = "select" | "payment" | "bank_info" | "complete" | "card_success" | "card_payment";
type PackageType = { id: string; points: number; priceExcludingTax: number; taxAmount: number; priceIncludingTax: number; bonusPoints: number | null };

let stripePromise: Promise<Stripe | null> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
    if (pk) {
      stripePromise = loadStripe(pk);
    } else {
      // fallback: fetch from backend (should not be needed if env var is set)
      stripePromise = fetch("/api/stripe/publishable-key")
        .then((res) => res.json())
        .then(({ publishableKey }) => loadStripe(publishableKey));
    }
  }
  return stripePromise;
}

function CheckoutForm({ 
  onSuccess, 
  onCancel,
  points,
  paymentIntentId,
}: { 
  onSuccess: (points: number) => void; 
  onCancel: () => void;
  points: number;
  paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError("カード情報を確認し、再度お試しください");
      setIsProcessing(false);
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/stripe/confirm-payment", {
        paymentIntentId,
      });
      const result = await response.json();

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        onSuccess(points);
      } else {
        setError("ポイントの付与に失敗しました");
      }
    } catch (err: any) {
      setError("決済確認に失敗しました");
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing}
        >
          戻る
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              処理中...
            </>
          ) : (
            "支払う"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PointsPurchase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const [step, setStep] = useState<Step>("select");
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [pendingTransfer, setPendingTransfer] = useState<BankTransferRequest | null>(null);
  const [purchasedPoints, setPurchasedPoints] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const success = params.get("success");
    const points = params.get("points");
    const canceled = params.get("canceled");

    if (success === "true" && points) {
      setPurchasedPoints(parseInt(points, 10));
      setStep("card_success");
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      window.history.replaceState({}, document.title, "/points-purchase");
    } else if (canceled === "true") {
      toast({ title: "決済がキャンセルされました", variant: "destructive" });
      window.history.replaceState({}, document.title, "/points-purchase");
    }
  }, [searchString, toast]);

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

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (packageData: PackageType) => {
      const response = await apiRequest("POST", "/api/stripe/create-payment-intent", {
        points: packageData.points,
        amount: packageData.priceIncludingTax,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setStep("card_payment");
      }
    },
    onError: (error: any) => {
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
      createPaymentIntentMutation.mutate(selectedPackage);
    } else {
      createBankTransferMutation.mutate(selectedPackage);
    }
  };

  const handlePaymentSuccess = (pts: number) => {
    setPurchasedPoints(pts);
    setStep("card_success");
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  const handlePaymentCancel = () => {
    setStep("payment");
    setClientSecret(null);
    setPaymentIntentId(null);
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

  if (step === "card_payment" && clientSecret && selectedPackage && paymentIntentId) {
    return (
      <div className="pb-20 overflow-y-auto scrollbar-hide">
        <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center h-14 px-4 gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={handlePaymentCancel}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <h1 className="font-bold text-base text-white">カード決済</h1>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">購入ポイント</p>
                <p className="text-xl font-bold">{selectedPackage.points.toLocaleString()} pt</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">お支払い金額</p>
                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  ¥{selectedPackage.priceIncludingTax.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-bold mb-4">カード情報</h3>
            <Elements
              stripe={getStripePromise()}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#ec4899',
                  },
                },
                locale: 'ja',
              }}
            >
              <CheckoutForm
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                points={selectedPackage.points}
                paymentIntentId={paymentIntentId}
              />
            </Elements>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "card_success" && purchasedPoints) {
    return (
      <div className="pb-20 overflow-y-auto scrollbar-hide">
        <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center h-14 px-4 gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setLocation("/account")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <h1 className="font-bold text-base text-white">購入完了</h1>
          </div>
        </header>

        <div className="p-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">ポイント購入完了</h2>
              <p className="text-muted-foreground mb-4">カード決済が正常に完了しました</p>
              
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground">購入ポイント</p>
                <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                  +{purchasedPoints.toLocaleString()} pt
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>ポイントは即座にアカウントに反映されました</p>
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

  if (step === "bank_info" && pendingTransfer) {
    return (
      <div className="pb-20 overflow-y-auto scrollbar-hide">
        <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center h-14 px-4 gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setLocation("/account")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <h1 className="font-bold text-base text-white">振込情報</h1>
          </div>
        </header>

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

              <div className="mt-6 p-4 bg-white/10 rounded-lg">
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
        <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center h-14 px-4 gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setStep("select")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
            <h1 className="font-bold text-base text-white">お支払い方法</h1>
          </div>
        </header>

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
            disabled={createBankTransferMutation.isPending || createPaymentIntentMutation.isPending}
            data-testid="button-confirm-payment"
          >
            {createBankTransferMutation.isPending || createPaymentIntentMutation.isPending ? "処理中..." : 
              paymentMethod === "card" ? "カード決済に進む" : "振込情報を確認"
            }
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 overflow-y-auto scrollbar-hide">
      <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link href="/account">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" data-testid="button-back">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Button>
          </Link>
          <h1 className="font-bold text-base text-white">ポイント購入</h1>
        </div>
      </header>

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

        <h2 className="font-bold text-lg text-white">ポイントパッケージを選択</h2>

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

        <Card className="p-4 bg-zinc-900 border-white/10">
          <h3 className="font-medium mb-2 flex items-center gap-2 text-white">
            <Info className="h-4 w-4 text-white/70" />
            ご利用について
          </h3>
          <ul className="text-sm text-white/60 space-y-1">
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
