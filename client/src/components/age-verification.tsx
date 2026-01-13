import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

interface AgeVerificationProps {
  onVerified: () => void;
}

export function AgeVerification({ onVerified }: AgeVerificationProps) {
  const handleYes = () => {
    try {
      localStorage.setItem("only-u-age-verified", "true");
      onVerified();
    } catch (e) {
      console.error("Failed to save age verification:", e);
      onVerified();
    }
  };

  const handleCancel = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full w-full flex items-center justify-center bg-white p-4"
        data-testid="modal-age-verification"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md flex flex-col items-center gap-8"
        >
          {/* Logo */}
          <img 
            src={logoImage} 
            alt="Only-U" 
            className="h-44 object-contain"
            data-testid="img-logo-age-verification"
          />

          {/* Warning Text */}
          <div className="text-center space-y-1">
            <p className="text-gray-700 text-sm" data-testid="text-age-warning-1">
              この先はアダルトコンテンツが含まれております
            </p>
            <p className="text-gray-700 text-sm" data-testid="text-age-warning-2">
              18歳未満の方のアクセスは固くお断りします
            </p>
          </div>

          {/* Question */}
          <p className="text-gray-900 font-bold text-lg" data-testid="text-age-question">
            あなたは18歳以上ですか？
          </p>

          {/* Buttons */}
          <div className="w-full max-w-xs mx-auto space-y-3">
            <Button
              onClick={handleYes}
              data-testid="button-verify-age-yes"
              className="w-full h-10 rounded-full text-sm font-bold bg-pink-500 hover:bg-pink-600 text-white"
            >
              はい
            </Button>
            
            <button
              onClick={handleCancel}
              data-testid="button-verify-age-cancel"
              className="w-full text-center text-pink-500 hover:text-pink-600 underline text-sm"
            >
              キャンセル
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
