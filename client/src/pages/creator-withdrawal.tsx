import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  ChevronLeft, 
  Wallet,
  Building2,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { WithdrawalRequest } from "@shared/schema";

interface BankInfo {
  bankName: string | null;
  bankBranchName: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  availableBalance: number;
}

export default function CreatorWithdrawal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankBranchName: "",
    bankAccountType: "普通",
    bankAccountNumber: "",
    bankAccountHolder: "",
  });

  const { data: bankInfo, isLoading: isLoadingBank, isError: isErrorBank } = useQuery<BankInfo>({
    queryKey: ["/api/creator/bank-info"],
  });

  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/creator/withdrawals"],
  });

  const updateBankMutation = useMutation({
    mutationFn: async (data: typeof bankForm) => {
      const response = await apiRequest("PUT", "/api/creator/bank-info", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bank-info"] });
      setIsBankDialogOpen(false);
      toast({ title: "口座情報を更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/creator/withdrawals", { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/bank-info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/sales"] });
      setIsWithdrawDialogOpen(false);
      setWithdrawAmount("");
      toast({ title: "振込申請を受け付けました" });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "振込申請に失敗しました", 
        variant: "destructive" 
      });
    },
  });

  const formatPoints = (points: number) => {
    return points.toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            振込完了
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            処理中
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            申請中
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            却下
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const openBankDialog = () => {
    setBankForm({
      bankName: bankInfo?.bankName || "",
      bankBranchName: bankInfo?.bankBranchName || "",
      bankAccountType: bankInfo?.bankAccountType || "普通",
      bankAccountNumber: bankInfo?.bankAccountNumber || "",
      bankAccountHolder: bankInfo?.bankAccountHolder || "",
    });
    setIsBankDialogOpen(true);
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < 3000) {
      toast({ title: "最低振込額は3,000ptです", variant: "destructive" });
      return;
    }
    if (amount > (bankInfo?.availableBalance || 0)) {
      toast({ title: "残高が不足しています", variant: "destructive" });
      return;
    }
    createWithdrawalMutation.mutate(amount);
  };

  const hasBankInfo = bankInfo?.bankName && bankInfo?.bankAccountNumber;
  const availableBalance = bankInfo?.availableBalance || 0;
  const fee = 300;
  const withdrawAmountNum = parseInt(withdrawAmount) || 0;
  const netAmount = withdrawAmountNum - fee;

  if (isLoadingBank) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/creator-sales")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">振込申請</h1>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isErrorBank) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center gap-3 p-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/creator-sales")}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">振込申請</h1>
          </div>
        </div>
        <div className="p-4">
          <Card className="p-8 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">データを取得できませんでした</p>
            <p className="text-sm text-muted-foreground mt-1">クリエイター登録が必要です</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/creator-sales")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">振込申請</h1>
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
            <div className="text-sm text-muted-foreground bg-background/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span>振込手数料: 300pt / 最低振込額: 3,000pt</span>
              </div>
              <p className="text-xs">振込は毎月15日・月末に処理されます</p>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold mb-3">振込先口座</h2>
          <Card className="p-4">
            {hasBankInfo ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{bankInfo.bankName}</p>
                    <p className="text-sm text-muted-foreground">{bankInfo.bankBranchName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{bankInfo.bankAccountType} {bankInfo.bankAccountNumber}</p>
                    <p className="text-sm text-muted-foreground">{bankInfo.bankAccountHolder}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={openBankDialog}
                  data-testid="button-edit-bank"
                >
                  口座情報を編集
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-3">振込先口座が登録されていません</p>
                <Button 
                  onClick={openBankDialog}
                  data-testid="button-register-bank"
                >
                  口座を登録する
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {hasBankInfo && availableBalance >= 3000 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4">
              <h3 className="font-bold mb-3">振込申請</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">振込金額 (pt)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="3000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min={3000}
                    max={availableBalance}
                    data-testid="input-withdraw-amount"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    最低 3,000pt 〜 最大 {formatPoints(availableBalance)}pt
                  </p>
                </div>
                
                {withdrawAmountNum >= 3000 && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>振込金額</span>
                      <span>{formatPoints(withdrawAmountNum)} pt</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>振込手数料</span>
                      <span>-{fee} pt</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>振込予定額</span>
                      <span className="text-pink-400">{formatPoints(netAmount)} 円</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full bg-pink-500"
                  disabled={withdrawAmountNum < 3000 || withdrawAmountNum > availableBalance || createWithdrawalMutation.isPending}
                  onClick={() => setIsWithdrawDialogOpen(true)}
                  data-testid="button-submit-withdrawal"
                >
                  {createWithdrawalMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  振込を申請する
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold mb-3">振込履歴</h2>
          {isLoadingWithdrawals ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : withdrawals && withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <Card key={withdrawal.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {withdrawal.createdAt ? format(new Date(withdrawal.createdAt), "yyyy/MM/dd", { locale: ja }) : "-"}
                      </span>
                    </div>
                    {getStatusBadge(withdrawal.status || "pending")}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-muted-foreground">{withdrawal.bankName} {withdrawal.bankAccountNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatPoints(withdrawal.netAmount)} 円</p>
                      <p className="text-xs text-muted-foreground">手数料 {withdrawal.fee}pt</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">振込履歴はありません</p>
            </Card>
          )}
        </motion.div>
      </div>

      <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>振込先口座の登録</DialogTitle>
            <DialogDescription>
              振込先の銀行口座情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bankName">銀行名</Label>
              <Input
                id="bankName"
                placeholder="例：三菱UFJ銀行"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                data-testid="input-bank-name"
              />
            </div>
            <div>
              <Label htmlFor="bankBranchName">支店名</Label>
              <Input
                id="bankBranchName"
                placeholder="例：渋谷支店"
                value={bankForm.bankBranchName}
                onChange={(e) => setBankForm({ ...bankForm, bankBranchName: e.target.value })}
                data-testid="input-branch-name"
              />
            </div>
            <div>
              <Label htmlFor="bankAccountType">口座種別</Label>
              <Select 
                value={bankForm.bankAccountType} 
                onValueChange={(value) => setBankForm({ ...bankForm, bankAccountType: value })}
              >
                <SelectTrigger data-testid="select-account-type">
                  <SelectValue placeholder="口座種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="普通">普通</SelectItem>
                  <SelectItem value="当座">当座</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bankAccountNumber">口座番号</Label>
              <Input
                id="bankAccountNumber"
                placeholder="例：1234567"
                value={bankForm.bankAccountNumber}
                onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })}
                data-testid="input-account-number"
              />
            </div>
            <div>
              <Label htmlFor="bankAccountHolder">口座名義（カナ）</Label>
              <Input
                id="bankAccountHolder"
                placeholder="例：ヤマダ タロウ"
                value={bankForm.bankAccountHolder}
                onChange={(e) => setBankForm({ ...bankForm, bankAccountHolder: e.target.value })}
                data-testid="input-account-holder"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBankDialogOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={() => updateBankMutation.mutate(bankForm)}
              disabled={!bankForm.bankName || !bankForm.bankAccountNumber || updateBankMutation.isPending}
              data-testid="button-save-bank"
            >
              {updateBankMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>振込申請の確認</DialogTitle>
            <DialogDescription>
              以下の内容で振込を申請しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">振込先</span>
              <span>{bankInfo?.bankName} {bankInfo?.bankAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">振込金額</span>
              <span>{formatPoints(withdrawAmountNum)} pt</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">手数料</span>
              <span>-{fee} pt</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>振込予定額</span>
              <span className="text-pink-400">{formatPoints(netAmount)} 円</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
              キャンセル
            </Button>
            <Button 
              className="bg-pink-500"
              onClick={handleWithdraw}
              disabled={createWithdrawalMutation.isPending}
              data-testid="button-confirm-withdrawal"
            >
              {createWithdrawalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              申請する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
