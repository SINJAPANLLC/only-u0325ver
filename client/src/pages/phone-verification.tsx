import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Phone,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@shared/schema";

export default function PhoneVerificationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");

  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  useEffect(() => {
    if (profile?.phoneNumber) {
      setPhoneNumber(profile.phoneNumber);
    }
  }, [profile]);

  const savePhoneMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/profile/phone", { phoneNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "電話番号を登録しました" });
    },
    onError: () => {
      toast({ title: "登録に失敗しました", variant: "destructive" });
    },
  });

  const isRegistered = !!profile?.phoneNumber;

  return (
    <div className="min-h-screen bg-black text-white pb-20 overflow-y-auto">
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-white hover:bg-white/10"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-base">電話番号登録</h1>
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
            <Card className="p-4 space-y-4 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-5 w-5 text-white/50" />
                <h2 className="font-semibold">電話番号を登録</h2>
                {isRegistered && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 ml-auto">
                    登録済み
                  </Badge>
                )}
              </div>

              <p className="text-sm text-white/50">
                連絡先として携帯電話番号を登録してください。
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">電話番号</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09012345678"
                    data-testid="input-phone"
                  />
                </div>

                <Button
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  onClick={() => savePhoneMutation.mutate()}
                  disabled={!phoneNumber || savePhoneMutation.isPending}
                  data-testid="button-save-phone"
                >
                  {savePhoneMutation.isPending ? "保存中..." : isRegistered ? "電話番号を更新" : "電話番号を登録"}
                </Button>

                {isRegistered && (
                  <div className="flex items-center gap-2 text-green-400 justify-center pt-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm">現在登録中: {profile?.phoneNumber}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
