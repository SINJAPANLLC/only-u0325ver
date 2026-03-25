import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Send,
  Mail,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const faqItems = [
  {
    question: "ポイントの購入方法を教えてください",
    answer: "アカウント画面の「所持ポイント」をタップし、「ポイント購入」ページから購入できます。銀行振込またはカード決済に対応しています。",
  },
  {
    question: "サブスクリプションの解約方法は？",
    answer: "アカウント画面の「加入中のプラン」から解約したいクリエイターを選択し、解約ボタンをタップしてください。",
  },
  {
    question: "購入したコンテンツはどこで見られますか？",
    answer: "アカウント画面の「購入履歴」から、これまでに購入したコンテンツを確認・再生できます。",
  },
  {
    question: "クリエイターになるには？",
    answer: "アカウント画面の「クリエイター申請」から申請できます。本人確認、電話番号認証、身分証明書の提出が必要です。",
  },
  {
    question: "振込申請の最低金額は？",
    answer: "振込申請は10,000ポイント以上から可能です。振込手数料330円、システム手数料16.5%が差し引かれます。",
  },
];

const contactFormSchema = z.object({
  category: z.string().min(1, "カテゴリを選択してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  subject: z.string().optional(),
  message: z.string().min(1, "お問い合わせ内容を入力してください"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function HelpPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { category: "", email: "", subject: "", message: "" },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({ title: "お問い合わせを送信しました" });
      form.reset();
    },
    onError: () => {
      toast({ title: "送信に失敗しました", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      toast({ title: "アカウントを削除しました" });
      logout();
      setLocation("/");
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const onSubmit = (data: ContactFormValues) => contactMutation.mutate(data);

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "退会する") {
      toast({ title: "確認テキストが一致しません", variant: "destructive" });
      return;
    }
    deleteAccountMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-8">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-gray-700 hover:bg-gray-100"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-base" data-testid="heading-page-title">ヘルプ・お問い合わせ</h1>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-bold text-sm" data-testid="heading-faq">よくある質問</h2>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
            {faqItems.map((item, index) => (
              <div key={index}>
                <button
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  data-testid={`button-faq-${index}`}
                >
                  <span className="text-sm font-medium pr-4" data-testid={`text-faq-question-${index}`}>{item.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-pink-400 shrink-0 transition-transform duration-200 ${openFaqIndex === index ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed" data-testid={`text-faq-answer-${index}`}>
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-bold text-sm" data-testid="heading-contact">お問い合わせ</h2>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">カテゴリ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl" data-testid="select-category">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="account">アカウントについて</SelectItem>
                          <SelectItem value="payment">決済・ポイントについて</SelectItem>
                          <SelectItem value="creator">クリエイター機能について</SelectItem>
                          <SelectItem value="content">コンテンツについて</SelectItem>
                          <SelectItem value="bug">不具合・バグ報告</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">メールアドレス</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@email.com" className="rounded-xl" data-testid="input-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">件名（任意）</FormLabel>
                      <FormControl>
                        <Input placeholder="お問い合わせの件名" className="rounded-xl" data-testid="input-subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-500">お問い合わせ内容</FormLabel>
                      <FormControl>
                        <Textarea placeholder="お問い合わせ内容を入力してください" rows={5} className="rounded-xl resize-none" data-testid="textarea-message" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold"
                  disabled={contactMutation.isPending}
                  data-testid="button-submit-contact"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {contactMutation.isPending ? "送信中..." : "送信する"}
                </Button>
              </form>
            </Form>
          </div>
        </motion.div>

        {/* Other contact */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-pink-400" />
              <h2 className="text-sm font-bold" data-testid="heading-other-contact">メールでのお問い合わせ</h2>
            </div>
            <p className="text-xs text-gray-500 mb-2" data-testid="text-other-contact-desc">
              フォームで解決しない場合はメールでもお問い合わせいただけます。
            </p>
            <a href="mailto:info@only-u.fun" className="text-sm text-pink-500 hover:underline font-medium" data-testid="link-email">
              info@only-u.fun
            </a>
          </div>
        </motion.div>

        {/* Delete account */}
        <div className="pt-2 text-center">
          <button
            className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1 mx-auto"
            onClick={() => setShowDeleteDialog(true)}
            data-testid="button-delete-account"
          >
            <Trash2 className="h-3 w-3" />
            アカウントを退会する
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500" data-testid="heading-delete-dialog">
              <AlertTriangle className="h-5 w-5" />
              アカウントの退会
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p data-testid="text-delete-warning">アカウントを削除すると、以下のデータが全て削除され、復元できません。</p>
              <ul className="list-disc list-inside text-sm space-y-1" data-testid="list-delete-items">
                <li data-testid="text-delete-item-0">プロフィール情報</li>
                <li data-testid="text-delete-item-1">購入履歴・ポイント残高</li>
                <li data-testid="text-delete-item-2">メッセージ履歴</li>
                <li data-testid="text-delete-item-3">フォロー・サブスクリプション</li>
                <li data-testid="text-delete-item-4">クリエイターデータ（該当する場合）</li>
              </ul>
              <p className="font-medium" data-testid="text-delete-confirm-instruction">退会を続ける場合は「退会する」と入力してください。</p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="退会する"
                className="rounded-xl"
                data-testid="input-delete-confirm"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")} data-testid="button-cancel-delete">キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "退会する" || deleteAccountMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteAccountMutation.isPending ? "処理中..." : "退会する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
