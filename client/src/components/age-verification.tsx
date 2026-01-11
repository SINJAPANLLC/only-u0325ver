import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import logoImage from "@assets/IMG_7372_2_1768100530058.JPG";

interface AgeVerificationProps {
  onVerified: () => void;
}

export function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [birthYear, setBirthYear] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");
  const [birthDay, setBirthDay] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleVerify = () => {
    setError(null);
    
    if (!birthYear || !birthMonth || !birthDay) {
      setError("生年月日を入力してください");
      return;
    }

    const birthDate = new Date(
      parseInt(birthYear),
      parseInt(birthMonth) - 1,
      parseInt(birthDay)
    );
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError("18歳未満の方はご利用いただけません");
      return;
    }

    if (!agreed) {
      setError("利用規約に同意してください");
      return;
    }

    try {
      localStorage.setItem("only-u-age-verified", "true");
      onVerified();
    } catch (e) {
      console.error("Failed to save age verification:", e);
      onVerified();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
        data-testid="modal-age-verification"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md rounded-2xl bg-card border border-card-border p-6 shadow-xl"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <img 
                src={logoImage} 
                alt="Only-U" 
                className="h-12 object-contain"
                data-testid="img-logo-age-verification"
              />
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm" data-testid="text-age-warning">このサービスは18歳以上の方のみご利用いただけます</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">生年月日</label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger data-testid="select-birth-year" className="rounded-xl h-12">
                      <SelectValue placeholder="年" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()} data-testid={`option-year-${year}`}>
                          {year}年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={birthMonth} onValueChange={setBirthMonth}>
                    <SelectTrigger data-testid="select-birth-month" className="rounded-xl h-12">
                      <SelectValue placeholder="月" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month.toString()} data-testid={`option-month-${month}`}>
                          {month}月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={birthDay} onValueChange={setBirthDay}>
                    <SelectTrigger data-testid="select-birth-day" className="rounded-xl h-12">
                      <SelectValue placeholder="日" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day.toString()} data-testid={`option-day-${day}`}>
                          {day}日
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-start gap-3 py-2">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  data-testid="checkbox-terms"
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  <a href="/terms" className="text-primary hover:underline">利用規約</a>、
                  <a href="/privacy" className="text-primary hover:underline">プライバシーポリシー</a>、および
                  <a href="/guidelines" className="text-primary hover:underline">掲載ガイドライン</a>
                  に同意します
                </label>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive text-center"
                  data-testid="text-age-error"
                >
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleVerify}
                data-testid="button-verify-age"
                className="w-full h-12 rounded-xl text-base font-semibold"
              >
                確認して進む
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center" data-testid="text-company-info">
              運営: 合同会社SIN JAPAN KANAGAWA
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
