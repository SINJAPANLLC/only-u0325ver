import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  ChevronLeft, 
  Mail,
  CheckCircle2,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function EmailVerificationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  interface EmailVerificationStatus {
    verified: boolean;
    email: string;
  }

  const { data: status, isLoading } = useQuery<EmailVerificationStatus>({
    queryKey: ["/api/verification/email/status"],
  });

  const sendCodeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/verification/email/send");
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({ title: "認証メールを送信しました" });
    },
    onError: () => {
      toast({ title: "送信に失敗しました", variant: "destructive" });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/verification/email/verify", { 
        code: verificationCode 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/verification/email/status"] });
      toast({ title: "メールアドレスを認証しました" });
      setCodeSent(false);
      setVerificationCode("");
    },
    onError: () => {
      toast({ title: "認証に失敗しました", variant: "destructive" });
    },
  });

  const isVerified = status?.verified;

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
          <h1 className="text-lg font-semibold">メールアドレス認証</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isVerified ? (
              <Card className="p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">認証済み</h2>
                    <p className="text-muted-foreground mt-1">
                      {user?.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    認証完了
                  </Badge>
                </div>
              </Card>
            ) : (
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">メールアドレスを確認</h2>
                </div>

                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  上記のメールアドレスに認証コードを送信します。
                </p>

                <div className="space-y-4">
                  {!codeSent ? (
                    <Button
                      className="w-full"
                      onClick={() => sendCodeMutation.mutate()}
                      disabled={sendCodeMutation.isPending}
                      data-testid="button-send-code"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendCodeMutation.isPending ? "送信中..." : "認証メールを送信"}
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="verificationCode">認証コード</Label>
                        <Input
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="6桁のコード"
                          maxLength={6}
                          data-testid="input-code"
                        />
                        <p className="text-xs text-muted-foreground">
                          メールに記載されたコードを入力してください
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setCodeSent(false);
                            setVerificationCode("");
                          }}
                          data-testid="button-resend"
                        >
                          再送信
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => verifyCodeMutation.mutate()}
                          disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                          data-testid="button-verify"
                        >
                          {verifyCodeMutation.isPending ? "認証中..." : "認証する"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
