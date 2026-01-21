import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { 
  ChevronLeft, 
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Mail,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const faqItems = [
  {
    question: "ポイントの購入方法を教えてください",
    answer: "アカウント画面の「所持ポイント」をタップし、「ポイント購入」ページから購入できます。銀行振込またはカード決済（準備中）に対応しています。",
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
  {
    question: "高画質プランとは？",
    answer: "月額980ポイントで、全てのコンテンツを4K・最高画質で視聴できるプランです。アカウント画面から加入できます。",
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
    defaultValues: {
      category: "",
      email: "",
      subject: "",
      message: "",
    },
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

  const onSubmit = (data: ContactFormValues) => {
    contactMutation.mutate(data);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== "退会する") {
      toast({ title: "確認テキストが一致しません", variant: "destructive" });
      return;
    }
    deleteAccountMutation.mutate();
  };

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
          <h1 className="text-lg font-semibold" data-testid="heading-page-title">ヘルプ・お問い合わせ</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold" data-testid="heading-faq">よくある質問</h2>
            </div>

            <div className="space-y-2">
              {faqItems.map((item, index) => (
                <Collapsible
                  key={index}
                  open={openFaqIndex === index}
                  onOpenChange={(open) => setOpenFaqIndex(open ? index : null)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className="w-full flex items-center justify-between p-3 rounded-lg hover-elevate text-left"
                      data-testid={`button-faq-${index}`}
                    >
                      <span className="font-medium text-sm pr-4" data-testid={`text-faq-question-${index}`}>{item.question}</span>
                      {openFaqIndex === index ? (
                        <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 pb-3 text-sm text-muted-foreground" data-testid={`text-faq-answer-${index}`}>
                      {item.answer}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold" data-testid="heading-contact">お問い合わせ</h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>カテゴリ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
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
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="example@email.com"
                          data-testid="input-email"
                          {...field}
                        />
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
                      <FormLabel>件名（任意）</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="お問い合わせの件名"
                          data-testid="input-subject"
                          {...field}
                        />
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
                      <FormLabel>お問い合わせ内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="お問い合わせ内容を入力してください"
                          rows={5}
                          data-testid="textarea-message"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={contactMutation.isPending}
                  data-testid="button-submit-contact"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {contactMutation.isPending ? "送信中..." : "送信する"}
                </Button>
              </form>
            </Form>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold" data-testid="heading-other-contact">その他のお問い合わせ</h2>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-other-contact-desc">
              上記フォームで解決しない場合は、メールでもお問い合わせいただけます。
            </p>
            <p className="text-sm mt-2">
              <a href="mailto:support@only-u.jp" className="text-primary hover:underline" data-testid="link-email">
                support@only-u.jp
              </a>
            </p>
          </Card>

          <div className="border-t pt-6">
            <button
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => setShowDeleteDialog(true)}
              data-testid="button-delete-account"
            >
              <Trash2 className="h-3 w-3 inline mr-1" />
              アカウントを退会する
            </button>
          </div>
        </motion.div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive" data-testid="heading-delete-dialog">
              <AlertTriangle className="h-5 w-5" />
              アカウントの退会
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p data-testid="text-delete-warning">
                アカウントを削除すると、以下のデータが全て削除され、復元できません。
              </p>
              <ul className="list-disc list-inside text-sm space-y-1" data-testid="list-delete-items">
                <li data-testid="text-delete-item-0">プロフィール情報</li>
                <li data-testid="text-delete-item-1">購入履歴・ポイント残高</li>
                <li data-testid="text-delete-item-2">メッセージ履歴</li>
                <li data-testid="text-delete-item-3">フォロー・サブスクリプション</li>
                <li data-testid="text-delete-item-4">クリエイターデータ（該当する場合）</li>
              </ul>
              <p className="font-medium" data-testid="text-delete-confirm-instruction">
                退会を続ける場合は「退会する」と入力してください。
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="退会する"
                data-testid="input-delete-confirm"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setDeleteConfirmText("")}
              data-testid="button-cancel-delete"
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
