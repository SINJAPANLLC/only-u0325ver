import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

interface AgeVerificationProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export function AgeVerification({ onVerified, onCancel }: AgeVerificationProps) {
  const handleYes = () => {
    try {
      localStorage.setItem("only-u-age-verified", "true");
      onVerified();
    } catch (e) {
      console.error("Failed to save age verification:", e);
      onVerified();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6" data-testid="modal-age-verification">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm flex flex-col items-center"
      >
        <img
          src={logoImage}
          alt="Only-U"
          className="w-32 h-auto object-contain mb-10"
          data-testid="img-logo-age-verification"
        />

        <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-6">
          <ShieldCheck className="h-8 w-8 text-pink-500" />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-3 text-center">年齢確認</h2>

        <div className="text-center mb-8 space-y-1.5">
          <p className="text-sm text-gray-500" data-testid="text-age-warning-1">
            この先はアダルトコンテンツが含まれています
          </p>
          <p className="text-sm font-medium text-gray-700" data-testid="text-age-warning-2">
            18歳未満の方のアクセスは固くお断りします
          </p>
        </div>

        <p className="text-lg font-bold text-gray-900 mb-6" data-testid="text-age-question">
          あなたは18歳以上ですか？
        </p>

        <div className="w-full space-y-3">
          <Button
            onClick={handleYes}
            data-testid="button-verify-age-yes"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full shadow-lg shadow-pink-200"
            style={{ height: "52px" }}
          >
            はい、18歳以上です
          </Button>

          <button
            onClick={onCancel}
            data-testid="button-verify-age-cancel"
            className="w-full text-center text-sm text-gray-400 hover:text-pink-500 transition-colors py-3"
          >
            いいえ、戻る
          </button>
        </div>

        <p className="text-[11px] text-gray-300 mt-8 text-center">
          Only-U &copy; {new Date().getFullYear()} 合同会社SIN JAPAN KANAGAWA
        </p>
      </motion.div>
    </div>
  );
}
