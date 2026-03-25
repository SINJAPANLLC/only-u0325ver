import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Megaphone, Sparkles, FileText, Mail, Plus, Trash2, Edit3, Eye, Send,
  Globe, CheckCircle, Clock, Loader2, Copy, RefreshCw, ExternalLink,
  Zap, Bot, Lock, HelpCircle,
} from "lucide-react";

interface ColumnArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  category: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  type: string | null;
  createdAt: string;
}

const PASSWORD_RESET_PREVIEW_HTML = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fff0f5;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff0f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #fce4ec;box-shadow:0 4px 24px rgba(236,64,122,0.08);">
      <tr><td style="background:linear-gradient(135deg,#f48fb1 0%,#f06292 50%,#ec407a 100%);padding:32px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50px;padding:6px 20px;margin-bottom:12px;">
          <span style="font-size:18px;font-weight:900;color:#fff;letter-spacing:3px;font-style:italic;">Only-U 💕</span>
        </div>
      </td></tr>
      <tr><td style="padding:40px 40px 32px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#fce4ec,#f8bbd0);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;line-height:72px;border:2px solid #f48fb1;">🔑</div>
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#c2185b;">パスワードのリセット</h1>
        <p style="margin:0 0 28px;font-size:14px;color:#ad1457;line-height:1.8;opacity:0.8;">パスワードリセットのリクエストを受け付けました。✨<br>下のボタンから新しいパスワードを設定してください。</p>
        <a href="#" style="display:inline-block;background:linear-gradient(135deg,#f06292,#ec407a);color:#fff;text-decoration:none;font-size:14px;font-weight:800;padding:14px 40px;border-radius:50px;box-shadow:0 4px 12px rgba(236,64,122,0.3);">パスワードをリセット ✨</a>
        <p style="margin:24px 0 0;font-size:12px;color:#f48fb1;">⏰ このリンクは1時間後に無効になります</p>
      </td></tr>
      <tr><td style="background:#fff0f5;padding:20px;text-align:center;border-top:1px solid #fce4ec;">
        <p style="margin:0;font-size:11px;color:#f48fb1;">© 2025 Only-U 💗 | 合同会社SIN JAPAN KANAGAWA</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

const CONTACT_EMAIL_PREVIEW_HTML = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fff0f5;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff0f5;padding:24px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #fce4ec;box-shadow:0 4px 24px rgba(236,64,122,0.08);">
      <tr><td style="background:linear-gradient(135deg,#f48fb1 0%,#f06292 50%,#ec407a 100%);padding:24px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50px;padding:6px 20px;">
          <span style="font-size:16px;font-weight:900;color:#fff;letter-spacing:2px;">Only-U 📩 お問い合わせ</span>
        </div>
      </td></tr>
      <tr><td style="padding:28px;">
        <div style="background:#fff0f5;border-radius:12px;padding:16px;border:1px solid #fce4ec;margin-bottom:16px;">
          <p style="margin:0 0 10px;font-size:13px;"><span style="background:#f8bbd0;color:#c2185b;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">カテゴリ</span> <span style="margin-left:6px;color:#555;">アカウントについて</span></p>
          <p style="margin:0 0 10px;font-size:13px;"><span style="background:#f8bbd0;color:#c2185b;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">送信者</span> <span style="margin-left:6px;color:#555;">user@example.com</span></p>
          <p style="margin:0;font-size:13px;"><span style="background:#f8bbd0;color:#c2185b;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">件名</span> <span style="margin-left:6px;color:#555;">ログインできない</span></p>
        </div>
        <hr style="border:none;border-top:1px solid #fce4ec;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">お問い合わせ内容がここに表示されます。</p>
      </td></tr>
      <tr><td style="background:#fff0f5;padding:16px;text-align:center;border-top:1px solid #fce4ec;">
        <p style="margin:0;font-size:11px;color:#f48fb1;">© 2025 Only-U 💗 | 合同会社SIN JAPAN KANAGAWA</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

const AUTO_EMAIL_TEMPLATES = [
  {
    id: "password-reset",
    name: "パスワードリセット",
    subject: "【Only-U】パスワードをリセットしてください",
    trigger: "ユーザーがパスワードリセットをリクエストした時",
    icon: Lock,
    htmlContent: PASSWORD_RESET_PREVIEW_HTML,
  },
  {
    id: "contact-confirm",
    name: "お問い合わせ受付確認",
    subject: "[Only-U お問い合わせ] カテゴリ: 件名",
    trigger: "ユーザーがお問い合わせフォームを送信した時（管理者宛）",
    icon: HelpCircle,
    htmlContent: CONTACT_EMAIL_PREVIEW_HTML,
  },
];

export default function AdminMarketing() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ===== SNS =====
  const [snsPlatform, setSnsPlatform] = useState("twitter");
  const [snsTopic, setSnsTopic] = useState("");
  const [snsTone, setSnsTone] = useState("フレンドリー");
  const [snsResult, setSnsResult] = useState("");
  const [snsLoading, setSnsLoading] = useState(false);

  // ===== Column =====
  const [columnDialog, setColumnDialog] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnArticle | null>(null);
  const [colKeyword, setColKeyword] = useState("");
  const [colAudience, setColAudience] = useState("一般ユーザー");
  const [colWordCount, setColWordCount] = useState("1500");
  const [colGenerating, setColGenerating] = useState(false);
  const [dailyGenerating, setDailyGenerating] = useState(false);
  const [colForm, setColForm] = useState({
    title: "", slug: "", excerpt: "", content: "",
    metaDescription: "", metaKeywords: "", category: "general", published: false,
  });
  const [colPreview, setColPreview] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);

  // ===== Email =====
  const [emailDialog, setEmailDialog] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);
  const [emailForm, setEmailForm] = useState({ name: "", subject: "", htmlContent: "", type: "marketing" });
  const [emailPreview, setEmailPreview] = useState(false);
  const [emailPurpose, setEmailPurpose] = useState("");
  const [emailTone, setEmailTone] = useState("フレンドリー");
  const [emailCTA, setEmailCTA] = useState("今すぐ登録");
  const [emailGenerating, setEmailGenerating] = useState(false);
  const [sendDialog, setSendDialog] = useState<EmailTemplate | null>(null);
  const [sendTarget, setSendTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [deleteEmailId, setDeleteEmailId] = useState<string | null>(null);

  // Queries
  const { data: columns = [], isLoading: colLoading } = useQuery<ColumnArticle[]>({
    queryKey: ["/api/admin/marketing/columns"],
  });

  const { data: emailTemplates = [], isLoading: emailLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/marketing/email-templates"],
  });

  // ===== SNS Generation =====
  const handleSnsGenerate = async () => {
    if (!snsTopic.trim()) { toast({ title: "トピックを入力してください", variant: "destructive" }); return; }
    setSnsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/marketing/generate-sns", {
        platform: snsPlatform, topic: snsTopic, tone: snsTone, language: "ja",
      });
      const data = await res.json();
      setSnsResult(data.text || "");
    } catch {
      toast({ title: "生成エラー", variant: "destructive" });
    } finally {
      setSnsLoading(false);
    }
  };

  // ===== Daily Auto-Generation =====
  const handleDailyGenerate = async () => {
    setDailyGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/marketing/generate-daily-columns", {});
      const data = await res.json();
      toast({ title: data.message || "バックグラウンドで生成開始しました" });
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["/api/admin/marketing/columns"] });
      }, 5 * 60 * 1000); // refresh after 5min
    } catch {
      toast({ title: "エラーが発生しました", variant: "destructive" });
    } finally {
      setDailyGenerating(false);
    }
  };

  // ===== Column Generation =====
  const handleColGenerate = async () => {
    if (!colKeyword.trim()) { toast({ title: "キーワードを入力してください", variant: "destructive" }); return; }
    setColGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/marketing/generate-column", {
        keyword: colKeyword, targetAudience: colAudience, wordCount: colWordCount,
      });
      const data = await res.json();
      setColForm({
        title: data.title || "", slug: data.slug || "",
        excerpt: data.excerpt || "", content: data.content || "",
        metaDescription: data.metaDescription || "",
        metaKeywords: data.metaKeywords || "",
        category: "general", published: false,
      });
      setEditingColumn(null);
      setColumnDialog(true);
    } catch {
      toast({ title: "生成エラー", variant: "destructive" });
    } finally {
      setColGenerating(false);
    }
  };

  const saveColumn = async () => {
    if (!colForm.title || !colForm.content) {
      toast({ title: "タイトルと本文は必須です", variant: "destructive" }); return;
    }
    try {
      if (editingColumn) {
        await apiRequest("PUT", `/api/admin/marketing/columns/${editingColumn.id}`, colForm);
      } else {
        await apiRequest("POST", "/api/admin/marketing/columns", colForm);
      }
      qc.invalidateQueries({ queryKey: ["/api/admin/marketing/columns"] });
      setColumnDialog(false);
      toast({ title: editingColumn ? "記事を更新しました" : "記事を保存しました" });
    } catch {
      toast({ title: "保存エラー", variant: "destructive" });
    }
  };

  const deleteColumn = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/admin/marketing/columns/${id}`);
      qc.invalidateQueries({ queryKey: ["/api/admin/marketing/columns"] });
      setDeleteColumnId(null);
      toast({ title: "記事を削除しました" });
    } catch {
      toast({ title: "削除エラー", variant: "destructive" });
    }
  };

  // ===== Email Generation =====
  const handleEmailGenerate = async () => {
    if (!emailPurpose.trim()) { toast({ title: "目的を入力してください", variant: "destructive" }); return; }
    setEmailGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/marketing/generate-email", {
        purpose: emailPurpose, tone: emailTone, callToAction: emailCTA,
      });
      const data = await res.json();
      setEmailForm(f => ({ ...f, subject: data.subject || f.subject, htmlContent: data.html || f.htmlContent }));
      if (!emailDialog) {
        setEditingEmail(null);
        setEmailDialog(true);
      }
    } catch {
      toast({ title: "生成エラー", variant: "destructive" });
    } finally {
      setEmailGenerating(false);
    }
  };

  const saveEmail = async () => {
    if (!emailForm.name || !emailForm.subject || !emailForm.htmlContent) {
      toast({ title: "テンプレート名・件名・本文は必須です", variant: "destructive" }); return;
    }
    try {
      if (editingEmail) {
        await apiRequest("PUT", `/api/admin/marketing/email-templates/${editingEmail.id}`, emailForm);
      } else {
        await apiRequest("POST", "/api/admin/marketing/email-templates", emailForm);
      }
      qc.invalidateQueries({ queryKey: ["/api/admin/marketing/email-templates"] });
      setEmailDialog(false);
      toast({ title: editingEmail ? "テンプレートを更新しました" : "テンプレートを保存しました" });
    } catch {
      toast({ title: "保存エラー", variant: "destructive" });
    }
  };

  const deleteEmail = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/admin/marketing/email-templates/${id}`);
      qc.invalidateQueries({ queryKey: ["/api/admin/marketing/email-templates"] });
      setDeleteEmailId(null);
      toast({ title: "テンプレートを削除しました" });
    } catch {
      toast({ title: "削除エラー", variant: "destructive" });
    }
  };

  const handleSendEmail = async () => {
    if (!sendDialog) return;
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/admin/marketing/send-email", {
        subject: sendDialog.subject, htmlContent: sendDialog.htmlContent, targetType: sendTarget,
      });
      const data = await res.json();
      toast({ title: `送信完了: ${data.sent}/${data.total}件` });
      setSendDialog(null);
    } catch {
      toast({ title: "送信エラー", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6" />
        <div>
          <h2 className="text-xl font-bold">マーケティング</h2>
          <p className="text-sm text-muted-foreground">SNS投稿・SEOコラム・メール営業をAIで管理</p>
        </div>
      </div>

      <Tabs defaultValue="sns">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sns" data-testid="tab-sns"><Megaphone className="h-4 w-4 mr-1" />SNS投稿</TabsTrigger>
          <TabsTrigger value="column" data-testid="tab-column"><FileText className="h-4 w-4 mr-1" />SEOコラム</TabsTrigger>
          <TabsTrigger value="email" data-testid="tab-email"><Mail className="h-4 w-4 mr-1" />メール営業</TabsTrigger>
        </TabsList>

        {/* ===== SNS Tab ===== */}
        <TabsContent value="sns" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> AI SNS投稿生成
              </CardTitle>
              <CardDescription>AIがSNS向けの投稿文を3パターン生成します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>プラットフォーム</Label>
                  <Select value={snsPlatform} onValueChange={setSnsPlatform}>
                    <SelectTrigger data-testid="select-sns-platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter / X</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="line">LINE公式</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>トーン</Label>
                  <Select value={snsTone} onValueChange={setSnsTone}>
                    <SelectTrigger data-testid="select-sns-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="フレンドリー">フレンドリー</SelectItem>
                      <SelectItem value="プロフェッショナル">プロフェッショナル</SelectItem>
                      <SelectItem value="キャッチー">キャッチー</SelectItem>
                      <SelectItem value="感情的">感情的・共感</SelectItem>
                      <SelectItem value="ユーモア">ユーモア</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>投稿トピック・内容 <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="例: 新しいクリエイターが参加しました！限定コンテンツ配信中"
                  value={snsTopic}
                  onChange={e => setSnsTopic(e.target.value)}
                  rows={3}
                  data-testid="input-sns-topic"
                />
              </div>
              <Button onClick={handleSnsGenerate} disabled={snsLoading} data-testid="button-sns-generate">
                {snsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                AI生成
              </Button>

              {snsResult && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>生成結果</Label>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(snsResult); toast({ title: "コピーしました" }); }}>
                      <Copy className="h-3 w-3 mr-1" /> コピー
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {snsResult}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Column Tab ===== */}
        <TabsContent value="column" className="space-y-4 mt-4">
          <Card className="border-pink-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400" />
            <CardHeader className="bg-gradient-to-br from-pink-50 to-white pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-pink-700">
                <Sparkles className="h-4 w-4 text-pink-500" /> AIコラム記事生成
              </CardTitle>
              <CardDescription className="text-pink-400">SEOに強い記事をAIで自動生成して /column で公開</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-pink-700">ターゲットキーワード <span className="text-pink-400">*</span></Label>
                  <Input className="border-pink-200 focus:border-pink-400 focus:ring-pink-200" placeholder="例: クリエイター 収益化" value={colKeyword} onChange={e => setColKeyword(e.target.value)} data-testid="input-col-keyword" />
                </div>
                <div className="space-y-2">
                  <Label className="text-pink-700">ターゲット読者</Label>
                  <Input className="border-pink-200 focus:border-pink-400 focus:ring-pink-200" placeholder="例: 20代女性クリエイター" value={colAudience} onChange={e => setColAudience(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-pink-700">文字数目安</Label>
                  <Select value={colWordCount} onValueChange={setColWordCount}>
                    <SelectTrigger className="border-pink-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="800">800字</SelectItem>
                      <SelectItem value="1500">1500字</SelectItem>
                      <SelectItem value="2500">2500字</SelectItem>
                      <SelectItem value="4000">4000字</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-sm" onClick={handleColGenerate} disabled={colGenerating} data-testid="button-col-generate">
                  {colGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AI記事生成（1件）
                </Button>
                <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50 rounded-full" onClick={() => {
                  setEditingColumn(null);
                  setColForm({ title: "", slug: "", excerpt: "", content: "", metaDescription: "", metaKeywords: "", category: "general", published: false });
                  setColumnDialog(true);
                }} data-testid="button-col-new">
                  <Plus className="h-4 w-4 mr-2" /> 手動で作成
                </Button>
              </div>

              <div className="border-t border-pink-100 pt-4 mt-2">
                <div className="flex items-start justify-between bg-pink-50 rounded-xl p-3 border border-pink-100">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2 text-pink-700"><Bot className="h-4 w-4 text-pink-500" /> 毎日10記事 自動生成 ✨</p>
                    <p className="text-xs text-pink-400 mt-1">毎日深夜に自動でSEOコラムを10記事生成・公開します。今すぐ実行することも可能です（約3〜5分かかります）。</p>
                  </div>
                  <Button size="sm" className="bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-sm ml-3 shrink-0" onClick={handleDailyGenerate} disabled={dailyGenerating} data-testid="button-daily-generate">
                    {dailyGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                    今すぐ10件生成
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300" />
            <CardHeader className="bg-gradient-to-br from-pink-50 to-white pb-3">
              <CardTitle className="text-base text-pink-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-pink-400" /> 記事一覧
              </CardTitle>
            </CardHeader>
            <CardContent>
              {colLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-pink-400" /></div>
              ) : columns.length === 0 ? (
                <div className="text-center py-8 text-pink-300">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>記事がありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {columns.map(col => (
                    <div key={col.id} className="flex items-start justify-between p-3 border border-pink-100 rounded-xl gap-3 bg-white hover:bg-pink-50 transition-colors" data-testid={`card-column-${col.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate text-gray-800">{col.title}</span>
                          <Badge className={`shrink-0 rounded-full text-xs ${col.published ? "bg-pink-100 text-pink-600 border-pink-200" : "bg-gray-100 text-gray-500 border-gray-200"}`} variant="outline">
                            {col.published ? <><CheckCircle className="h-3 w-3 mr-1" />公開中</> : <><Clock className="h-3 w-3 mr-1" />下書き</>}
                          </Badge>
                        </div>
                        <div className="text-xs text-pink-400 mt-1">
                          /column/{col.slug} ・ {col.category}
                        </div>
                        {col.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{col.excerpt}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {col.published && (
                          <Button variant="ghost" size="icon" className="hover:text-pink-500" asChild>
                            <a href={`/column/${col.slug}`} target="_blank" rel="noreferrer" data-testid={`link-column-view-${col.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="hover:text-pink-500" onClick={() => {
                          setEditingColumn(col);
                          setColForm({
                            title: col.title, slug: col.slug, excerpt: col.excerpt || "",
                            content: col.content, metaDescription: col.metaDescription || "",
                            metaKeywords: col.metaKeywords || "", category: col.category || "general",
                            published: col.published,
                          });
                          setColumnDialog(true);
                        }} data-testid={`button-col-edit-${col.id}`}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500" onClick={() => setDeleteColumnId(col.id)} data-testid={`button-col-delete-${col.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Email Tab ===== */}
        <TabsContent value="email" className="space-y-4 mt-4">
          <Card className="border-pink-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400" />
            <CardHeader className="bg-gradient-to-br from-pink-50 to-white pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-pink-700">
                <Sparkles className="h-4 w-4 text-pink-500" /> AIメール生成
              </CardTitle>
              <CardDescription className="text-pink-400">目的を入力するとHTMLメールを自動生成します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-pink-700">メールの目的 <span className="text-pink-400">*</span></Label>
                  <Textarea className="border-pink-200 focus:border-pink-400 focus:ring-pink-200" placeholder="例: 新規ユーザー獲得キャンペーンのお知らせ。Only-Uで収益化できるクリエイターを募集" value={emailPurpose} onChange={e => setEmailPurpose(e.target.value)} rows={2} data-testid="input-email-purpose" />
                </div>
                <div className="space-y-2">
                  <Label className="text-pink-700">トーン</Label>
                  <Select value={emailTone} onValueChange={setEmailTone}>
                    <SelectTrigger className="border-pink-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="フレンドリー">フレンドリー</SelectItem>
                      <SelectItem value="プロフェッショナル">プロフェッショナル</SelectItem>
                      <SelectItem value="緊急感のある">緊急感のある</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-pink-700">CTA（行動喚起）</Label>
                  <Input className="border-pink-200 focus:border-pink-400 focus:ring-pink-200" placeholder="今すぐ登録" value={emailCTA} onChange={e => setEmailCTA(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-sm" onClick={handleEmailGenerate} disabled={emailGenerating} data-testid="button-email-generate">
                  {emailGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AIでメール生成
                </Button>
                <Button variant="outline" className="border-pink-300 text-pink-600 hover:bg-pink-50 rounded-full" onClick={() => {
                  setEditingEmail(null);
                  setEmailForm({ name: "", subject: "", htmlContent: getDefaultEmailHtml(), type: "marketing" });
                  setEmailDialog(true);
                }} data-testid="button-email-new">
                  <Plus className="h-4 w-4 mr-2" /> 手動で作成
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400" />
            <CardHeader className="bg-gradient-to-br from-pink-50 to-white pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-pink-700">
                <Bot className="h-4 w-4 text-pink-500" /> 自動送信メール（システム）
              </CardTitle>
              <CardDescription className="text-pink-400">ユーザーアクションに応じて自動送信されます。プレビューのみ可能。</CardDescription>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2">
                {AUTO_EMAIL_TEMPLATES.map(tmpl => (
                  <div key={tmpl.id} className="flex items-center justify-between p-3 border border-pink-100 rounded-xl gap-3 bg-white hover:bg-pink-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <tmpl.icon className="h-3.5 w-3.5 text-pink-500" />
                        </div>
                        <span className="font-semibold text-sm text-pink-800">{tmpl.name}</span>
                        <Badge className="text-xs rounded-full bg-pink-100 text-pink-600 border-pink-200" variant="outline">自動 ✨</Badge>
                      </div>
                      <p className="text-xs text-pink-400 mt-0.5 ml-9">件名: {tmpl.subject}</p>
                      <p className="text-xs text-pink-300 ml-9">トリガー: {tmpl.trigger}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-pink-400 hover:text-pink-600 hover:bg-pink-100 rounded-full" onClick={() => {
                      setEditingEmail(null);
                      setEmailForm({ name: tmpl.name, subject: tmpl.subject, htmlContent: tmpl.htmlContent, type: "automated" });
                      setEmailPreview(true);
                      setEmailDialog(true);
                    }} data-testid={`button-auto-preview-${tmpl.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300" />
            <CardHeader className="bg-gradient-to-br from-pink-50 to-white pb-3">
              <CardTitle className="text-base text-pink-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-pink-400" /> メールテンプレート一覧
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emailLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-pink-400" /></div>
              ) : emailTemplates.length === 0 ? (
                <div className="text-center py-8 text-pink-300">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>テンプレートがありません</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emailTemplates.map(tmpl => (
                    <div key={tmpl.id} className="flex items-center justify-between p-3 border border-pink-100 rounded-xl gap-3 bg-white hover:bg-pink-50 transition-colors" data-testid={`card-email-${tmpl.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-pink-800">{tmpl.name}</span>
                          <Badge className="text-xs rounded-full bg-pink-50 text-pink-500 border-pink-200" variant="outline">{tmpl.type}</Badge>
                        </div>
                        <p className="text-xs text-pink-400 mt-0.5">件名: {tmpl.subject}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="hover:text-pink-500 hover:bg-pink-100 rounded-full" onClick={() => setSendDialog(tmpl)} data-testid={`button-email-send-${tmpl.id}`}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-pink-500 hover:bg-pink-100 rounded-full" onClick={() => {
                          setEditingEmail(tmpl);
                          setEmailForm({ name: tmpl.name, subject: tmpl.subject, htmlContent: tmpl.htmlContent, type: tmpl.type || "marketing" });
                          setEmailDialog(true);
                        }} data-testid={`button-email-edit-${tmpl.id}`}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => setDeleteEmailId(tmpl.id)} data-testid={`button-email-delete-${tmpl.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Column Article Dialog */}
      <Dialog open={columnDialog} onOpenChange={setColumnDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingColumn ? "記事を編集" : "記事を作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>タイトル <span className="text-red-500">*</span></Label>
                <Input value={colForm.title} onChange={e => {
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9ぁ-んァ-ン一-龥]+/g, "-").replace(/^-|-$/g, "");
                  setColForm(f => ({ ...f, title: e.target.value, slug: f.slug || slug }));
                }} placeholder="記事タイトル" data-testid="input-col-title" />
              </div>
              <div className="space-y-2">
                <Label>スラッグ（URL）</Label>
                <Input value={colForm.slug} onChange={e => setColForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-friendly-slug" data-testid="input-col-slug" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>概要（抜粋）</Label>
              <Textarea value={colForm.excerpt} onChange={e => setColForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} placeholder="120字程度の記事概要" data-testid="input-col-excerpt" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>本文（HTML）<span className="text-red-500">*</span></Label>
                <Button variant="ghost" size="sm" onClick={() => setColPreview(!colPreview)}>
                  <Eye className="h-3 w-3 mr-1" /> {colPreview ? "編集" : "プレビュー"}
                </Button>
              </div>
              {colPreview ? (
                <div className="border rounded-lg p-4 min-h-48 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: colForm.content }} />
              ) : (
                <Textarea value={colForm.content} onChange={e => setColForm(f => ({ ...f, content: e.target.value }))} rows={12} placeholder="<p>記事の本文をHTMLで入力...</p>" className="font-mono text-sm" data-testid="input-col-content" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>メタディスクリプション</Label>
                <Textarea value={colForm.metaDescription} onChange={e => setColForm(f => ({ ...f, metaDescription: e.target.value }))} rows={2} placeholder="160字以内のSEO説明文" />
              </div>
              <div className="space-y-2">
                <Label>メタキーワード</Label>
                <Input value={colForm.metaKeywords} onChange={e => setColForm(f => ({ ...f, metaKeywords: e.target.value }))} placeholder="キーワード1,キーワード2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>カテゴリ</Label>
                <Select value={colForm.category} onValueChange={v => setColForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">一般</SelectItem>
                    <SelectItem value="creator">クリエイター向け</SelectItem>
                    <SelectItem value="fan">ファン向け</SelectItem>
                    <SelectItem value="news">ニュース</SelectItem>
                    <SelectItem value="tips">ヒント・ノウハウ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>公開状態</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={colForm.published} onCheckedChange={v => setColForm(f => ({ ...f, published: v }))} data-testid="switch-col-published" />
                  <span className="text-sm">{colForm.published ? "公開" : "下書き"}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColumnDialog(false)}>キャンセル</Button>
            <Button onClick={saveColumn} data-testid="button-col-save">
              {colForm.published ? <><Globe className="h-4 w-4 mr-2" />公開する</> : <>保存（下書き）</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Confirm */}
      <Dialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>記事を削除しますか？</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">この操作は取り消せません。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteColumnId(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deleteColumnId && deleteColumn(deleteColumnId)}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Template Dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmail ? "テンプレートを編集" : "テンプレートを作成"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>テンプレート名 <span className="text-red-500">*</span></Label>
                <Input value={emailForm.name} onChange={e => setEmailForm(f => ({ ...f, name: e.target.value }))} placeholder="例: 新規登録キャンペーン" data-testid="input-email-name" />
              </div>
              <div className="space-y-2">
                <Label>種別</Label>
                <Select value={emailForm.type} onValueChange={v => setEmailForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">マーケティング</SelectItem>
                    <SelectItem value="newsletter">ニュースレター</SelectItem>
                    <SelectItem value="automated">自動メール</SelectItem>
                    <SelectItem value="promotion">プロモーション</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>件名 <span className="text-red-500">*</span></Label>
              <Input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="メール件名" data-testid="input-email-subject" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>HTMLコード <span className="text-red-500">*</span></Label>
                <Button variant="ghost" size="sm" onClick={() => setEmailPreview(!emailPreview)}>
                  <Eye className="h-3 w-3 mr-1" /> {emailPreview ? "コード編集" : "プレビュー"}
                </Button>
              </div>
              {emailPreview ? (
                <div className="border rounded-lg overflow-hidden" style={{ height: 480 }}>
                  <iframe
                    srcDoc={emailForm.htmlContent}
                    className="w-full h-full"
                    title="email-preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <Textarea
                  value={emailForm.htmlContent}
                  onChange={e => setEmailForm(f => ({ ...f, htmlContent: e.target.value }))}
                  rows={16}
                  placeholder="<!DOCTYPE html><html>...</html>"
                  className="font-mono text-xs"
                  data-testid="input-email-html"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEmailPreview(!emailPreview); }}>
              {emailPreview ? "コード編集" : <><Eye className="h-4 w-4 mr-2" />プレビュー</>}
            </Button>
            <Button variant="outline" onClick={() => setEmailDialog(false)}>キャンセル</Button>
            <Button onClick={saveEmail} data-testid="button-email-save">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Email Confirm */}
      <Dialog open={!!deleteEmailId} onOpenChange={() => setDeleteEmailId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>テンプレートを削除しますか？</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">この操作は取り消せません。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEmailId(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deleteEmailId && deleteEmail(deleteEmailId)}>削除する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={!!sendDialog} onOpenChange={() => setSendDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>メールを送信</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p><strong>件名:</strong> {sendDialog?.subject}</p>
              <p><strong>テンプレート:</strong> {sendDialog?.name}</p>
            </div>
            <div className="space-y-2">
              <Label>送信対象</Label>
              <Select value={sendTarget} onValueChange={setSendTarget}>
                <SelectTrigger data-testid="select-send-target"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全ユーザー</SelectItem>
                  <SelectItem value="creators">クリエイターのみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">※ 最大200件まで一括送信されます</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(null)}>キャンセル</Button>
            <Button onClick={handleSendEmail} disabled={sending} data-testid="button-send-confirm">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              送信する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getDefaultEmailHtml(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Only-U</title>
</head>
<body style="margin:0;padding:0;background-color:#fff0f5;font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Yu Gothic',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff0f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #fce4ec;box-shadow:0 4px 32px rgba(236,64,122,0.08);">

      <!-- Header with pink gradient -->
      <tr><td style="background:linear-gradient(135deg,#f48fb1 0%,#f06292 50%,#ec407a 100%);padding:36px 48px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50px;padding:8px 24px;margin-bottom:10px;">
          <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:3px;font-style:italic;">Only-U 💕</span>
        </div>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.85);letter-spacing:2px;">クリエイターとファンをつなぐ</p>
      </td></tr>

      <!-- Hero Section -->
      <tr><td style="padding:48px 48px 32px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#fce4ec,#f8bbd0);border:2px solid #f48fb1;margin:0 auto 24px;font-size:32px;line-height:72px;text-align:center;">
          ✨
        </div>
        <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#c2185b;line-height:1.3;">
          ここにタイトルを入れてください
        </h1>
        <p style="margin:0 auto;font-size:15px;color:#ad1457;line-height:1.8;max-width:400px;opacity:0.8;">
          ここに本文を書いてください。ユーザーへの価値あるメッセージを届けましょう。
        </p>
      </td></tr>

      <!-- CTA Button -->
      <tr><td style="padding:0 48px 48px;text-align:center;">
        <a href="https://only-u.fun"
           style="display:inline-block;background:linear-gradient(135deg,#f06292,#ec407a);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(236,64,122,0.35);">
          今すぐOnly-Uを見る ✨
        </a>
      </td></tr>

      <!-- Divider -->
      <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #fce4ec;margin:0;" /></td></tr>

      <!-- Feature Highlights -->
      <tr><td style="padding:32px 48px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" style="text-align:center;padding:16px 8px;background:#fff0f5;border-radius:12px 0 0 12px;">
              <div style="font-size:28px;margin-bottom:8px;">🎬</div>
              <p style="margin:0;font-size:12px;font-weight:700;color:#c2185b;">限定動画</p>
              <p style="margin:4px 0 0;font-size:11px;color:#f48fb1;">独占コンテンツ</p>
            </td>
            <td width="33%" style="text-align:center;padding:16px 8px;background:#fce4ec;border-left:2px solid #fff;border-right:2px solid #fff;">
              <div style="font-size:28px;margin-bottom:8px;">📡</div>
              <p style="margin:0;font-size:12px;font-weight:700;color:#c2185b;">LIVE配信</p>
              <p style="margin:4px 0 0;font-size:11px;color:#f48fb1;">リアルタイム体験</p>
            </td>
            <td width="33%" style="text-align:center;padding:16px 8px;background:#fff0f5;border-radius:0 12px 12px 0;">
              <div style="font-size:28px;margin-bottom:8px;">💎</div>
              <p style="margin:0;font-size:12px;font-weight:700;color:#c2185b;">限定特典</p>
              <p style="margin:4px 0 0;font-size:11px;color:#f48fb1;">メンバー専用</p>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#fff0f5;padding:24px 48px;text-align:center;border-top:1px solid #fce4ec;">
        <p style="margin:0 0 6px;font-size:12px;color:#f48fb1;">
          © 2025 Only-U 💗 &nbsp;|&nbsp; 合同会社SIN JAPAN KANAGAWA
        </p>
        <p style="margin:0;font-size:11px;">
          <a href="https://only-u.fun" style="color:#f48fb1;text-decoration:none;">配信停止はこちら</a>
          &nbsp;·&nbsp;
          <a href="https://only-u.fun/privacy" style="color:#f48fb1;text-decoration:none;">プライバシーポリシー</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

