import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mb-8">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary/10 to-pink-400/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl font-bold gradient-text">404</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">ページが見つかりません</h1>
          <p className="text-muted-foreground">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="rounded-xl h-12"
            data-testid="button-go-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <Link href="/">
            <Button className="rounded-xl h-12 w-full sm:w-auto" data-testid="button-go-home">
              <Home className="h-4 w-4 mr-2" />
              ホームへ
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
