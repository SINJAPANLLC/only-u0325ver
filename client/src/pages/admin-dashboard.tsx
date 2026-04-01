import { useState, useEffect } from "react";
import AdminMarketing from "./admin-marketing";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Wallet,
  LogOut,
  Menu,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Video,
  ShoppingBag,
  Radio,
  CreditCard,
  Settings,
  Trash2,
  Eye,
  Ban,
  TrendingUp,
  Megaphone,
  MessageSquare,
  HelpCircle,
  Bell,
  Play,
  DollarSign,
  BarChart3,
  Mail,
  Sparkles,
  Send,
  Crown,
  ShieldAlert,
  MapPin,
  Phone,
  Calendar,
  Activity,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreatorApplication, BankTransferRequest } from "@shared/schema";
import logoImage from "@assets/IMG_9769_1768973936225.PNG";

type Tab = "dashboard" | "sales" | "users" | "user-audit" | "creators" | "livestreams" | "content" | "shop" | "marketing" | "messages" | "transfers" | "withdrawals" | "inquiries" | "notifications" | "moderation" | "ai-generate" | "settings";

interface DashboardStats {
  totalUsers: number;
  totalCreators: number;
  pendingApplications: number;
  pendingTransfers: number;
  totalVideos: number;
  totalProducts: number;
  pendingWithdrawals: number;
  activeLiveStreams: number;
}

interface VideoData {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  creatorId: string;
  creatorName: string;
  viewCount: number;
  likeCount: number;
  isPremium: boolean;
  createdAt: string;
}

interface ProductData {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  creatorId: string;
  creatorName: string;
  stock: number | null;
  productType: string;
  createdAt: string;
  totalEarnings: number;
  salesCount: number;
}

interface OrderData {
  id: string;
  userId: string;
  productId: string;
  creatorId: string | null;
  price: number;
  status: string | null;
  shippingName: string | null;
  shippingPostalCode: string | null;
  shippingAddress: string | null;
  shippingPhone: string | null;
  createdAt: string | null;
  productName: string | null;
  productType: string | null;
  productImageUrl: string | null;
  buyerName: string;
  creatorName: string;
}

interface LiveStreamData {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  creatorId: string;
  creatorName: string;
  status: string;
  viewerCount: number;
  startedAt: string | null;
}

interface WithdrawalData {
  id: string;
  creatorId: string;
  userName: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankName: string;
  bankBranchName: string;
  bankAccountType: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  status: string;
  isEarly: boolean;
  createdAt: string;
}

interface UserData {
  id: string;
  username: string | null;
  email: string | null;
  createdAt: string | null;
  points: number | null;
  displayName: string | null;
  avatarUrl: string | null;
  isCreator: string | null;
  creatorEarnings: number | null;
  creatorBalance: number | null;
}

interface ModerationAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  contentType: string | null;
  contentId: string | null;
  creatorId: string | null;
  severity: "low" | "medium" | "high" | null;
  isRead: boolean | null;
  actionTaken: string | null;
  actionBy: string | null;
  actionAt: string | null;
  createdAt: string | null;
}

interface SalesData {
  creatorRevenue: {
    subscription: number;
    live: number;
    shop: number;
    shopCount: number;
    total: number;
  };
  platformSubscription?: {
    total: number;
    count: number;
  };
  creatorPaymentExpenses: {
    feeBaseAmount: number;
    systemFee: number;
    systemFeeTax: number;
    earlyPaymentAmount: number;
    earlyPaymentCount: number;
    earlyPaymentFee: number;
    earlyPaymentFeeTax: number;
    transferFee: number;
    transferCount: number;
    total: number;
  };
  pointPurchase: {
    bankTransfer: number;
    bankTransferCount: number;
    stripe: number;
    stripeCount: number;
    total: number;
    totalCount: number;
    fee: number;
    feeTax: number;
    revenue: number;
  };
  netProfit: number;
  totalPlatformRevenue: number;
  recentTransactions: {
    id: string;
    category: string;
    userId: string;
    userName: string;
    creatorId?: string | null;
    creatorName?: string | null;
    amount: number;
    type: string;
    description: string | null;
    createdAt: string;
  }[];
}

interface MarketingData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalFollows: number;
  activeSubscriptions: number;
  totalVideoViews: number;
  totalVideoLikes: number;
}

interface MessagesData {
  totalMessages: number;
  totalConversations: number;
  recentMessages: {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    recipientId: string | null;
    recipientName: string;
    content: string;
    createdAt: string;
  }[];
}

interface InquiryData {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  respondedAt: string | null;
}

interface NotificationsData {
  totalNotifications: number;
  unreadNotifications: number;
  recentNotifications: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];
}

// ===== Bunny Stream Channel Manager =====
function BunnyChannelManager({ channels, onRefresh }: { channels: any[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [streamId, setStreamId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!name || !streamKey || !streamId) {
      toast({ title: "すべての項目を入力してください", variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/bunny-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, streamKey, streamId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed");
      }
      toast({ title: "チャンネルを追加しました" });
      setName(""); setStreamKey(""); setStreamId("");
      onRefresh();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/bunny-channels/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      toast({ title: "削除しました" });
      onRefresh();
    } catch {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bunny Streamチャンネル管理</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bunnyダッシュボードで作成したライブストリームチャンネルを登録します。
            クリエイターがライブを開始すると、空きチャンネルが自動的に割り当てられます。
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
            <p className="font-medium">Bunnyダッシュボードでの確認方法：</p>
            <p className="text-muted-foreground">1. video.bunnycdn.com → Stream → ライブラリ → チャンネル作成</p>
            <p className="text-muted-foreground">2. 「Stream Key」（インジェストキー）をコピー</p>
            <p className="text-muted-foreground">3. 「Stream ID」（チャンネルのGUID）をコピー</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">チャンネル名</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                placeholder="例: Channel-1"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Stream Key（インジェストキー）</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
                placeholder="例: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={streamKey}
                onChange={e => setStreamKey(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Stream ID（チャンネルID）</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background font-mono"
                placeholder="例: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={streamId}
                onChange={e => setStreamId(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={isAdding} className="w-full">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            チャンネルを追加
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>登録済みチャンネル（{channels.length}件）</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">チャンネルが登録されていません</p>
          ) : (
            <div className="space-y-3">
              {channels.map((ch: any) => (
                <div key={ch.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{ch.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ch.isAvailable ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {ch.isAvailable ? "空き" : "使用中"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">Key: {ch.streamKey}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">ID: {ch.streamId}</p>
                    {ch.currentLiveStreamId && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 truncate">配信ID: {ch.currentLiveStreamId}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                    onClick={() => handleDelete(ch.id)}
                    disabled={!ch.isAvailable}
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface VeniceModel {
  id: string;
  model_spec?: { name: string; traits?: string[] };
}

function VeniceImageGenerator() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("ugly, deformed, bad anatomy, watermark, text");
  const [selectedModel, setSelectedModel] = useState("lustify-v7");
  const [width, setWidth] = useState("832");
  const [height, setHeight] = useState("1216");
  const [steps, setSteps] = useState("30");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: models } = useQuery<VeniceModel[]>({
    queryKey: ["/api/admin/venice/models"],
  });

  const generate = async () => {
    if (!prompt.trim()) {
      toast({ title: "プロンプトを入力してください", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/venice/generate", {
        prompt,
        negativePrompt,
        model: selectedModel,
        width: parseInt(width),
        height: parseInt(height),
        steps: parseInt(steps),
      });
      const data = await res.json();
      if (data.images?.length) {
        setGeneratedImages(prev => [...data.images.map((b64: string) => `data:image/webp;base64,${b64}`), ...prev]);
      } else {
        toast({ title: "生成に失敗しました", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: e.message || "エラーが発生しました", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (dataUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `venice-ai-${Date.now()}-${index}.webp`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-pink-400" />
        <h2 className="text-2xl font-bold text-white">Venice AI 画像生成</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">生成設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white/80 text-sm mb-1.5 block">モデル</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {models?.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-white">
                        {m.model_spec?.name || m.id}
                        {m.model_spec?.traits?.includes("most_uncensored") && (
                          <span className="ml-1 text-xs text-pink-400">🔞</span>
                        )}
                      </SelectItem>
                    )) ?? (
                      <>
                        <SelectItem value="lustify-v7" className="text-white">Lustify v7 🔞</SelectItem>
                        <SelectItem value="lustify-sdxl" className="text-white">Lustify SDXL</SelectItem>
                        <SelectItem value="flux-2-pro" className="text-white">Flux 2 Pro</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white/80 text-sm mb-1.5 block">プロンプト</Label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="beautiful japanese woman, portrait, high quality..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                  rows={5}
                />
              </div>

              <div>
                <Label className="text-white/80 text-sm mb-1.5 block">ネガティブプロンプト</Label>
                <Textarea
                  value={negativePrompt}
                  onChange={e => setNegativePrompt(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-white/80 text-xs mb-1 block">幅</Label>
                  <Select value={width} onValueChange={setWidth}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {["512","640","768","832","1024","1280"].map(v => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/80 text-xs mb-1 block">高さ</Label>
                  <Select value={height} onValueChange={setHeight}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {["512","640","768","832","1024","1216","1280","1536"].map(v => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/80 text-xs mb-1 block">ステップ</Label>
                  <Select value={steps} onValueChange={setSteps}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      {["20","25","30","40","50"].map(v => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    画像を生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {generatedImages.length === 0 && !isGenerating ? (
            <div className="h-64 flex flex-col items-center justify-center text-white/40 border-2 border-dashed border-white/10 rounded-2xl">
              <Sparkles className="h-12 w-12 mb-3 opacity-30" />
              <p>プロンプトを入力して画像を生成してください</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {isGenerating && (
                <div className="aspect-[2/3] bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-400" />
                  <p className="text-white/60 text-sm">生成中...</p>
                </div>
              )}
              {generatedImages.map((img, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10">
                  <img src={img} alt={`generated-${i}`} className="w-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/30 text-white bg-black/50 hover:bg-white/20"
                      onClick={() => downloadImage(img, i)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      DL
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applicationFilter, setApplicationFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [transferFilter, setTransferFilter] = useState<"pending" | "confirmed" | "rejected" | "all">("pending");
  const [userSearch, setUserSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<BankTransferRequest | null>(null);
  const [transferToConfirm, setTransferToConfirm] = useState<BankTransferRequest | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<{ id: number; from: string; subject: string; date: string; text: string; html: string } | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [pointAdjustment, setPointAdjustment] = useState(0);
  const [pointReason, setPointReason] = useState("");
  
  // Notification management state
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("system");
  const [notifSendEmail, setNotifSendEmail] = useState(false);
  const [notifEmailSubject, setNotifEmailSubject] = useState("");
  const [notifEmailBody, setNotifEmailBody] = useState("");
  const [notifTarget, setNotifTarget] = useState<"all" | "specific">("all");
  const [notifUserSearch, setNotifUserSearch] = useState("");
  const [notifSelectedUsers, setNotifSelectedUsers] = useState<string[]>([]);
  const [notifAiPrompt, setNotifAiPrompt] = useState("");
  
  // Settings form state
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsChanged, setSettingsChanged] = useState(false);

  const { data: authStatus, isLoading: isCheckingAuth } = useQuery({
    queryKey: ["/api/admin/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/auth/me");
      return res.json();
    },
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: authStatus?.authenticated,
  });

  const { data: applications, isLoading: isLoadingApps } = useQuery<(CreatorApplication & { username?: string | null })[]>({
    queryKey: ["/api/admin/creator-applications", applicationFilter],
    queryFn: async () => {
      const params = applicationFilter !== "all" ? `?status=${applicationFilter}` : "";
      const res = await fetch(`/api/admin/creator-applications${params}`);
      return res.json();
    },
    enabled: authStatus?.authenticated && activeTab === "creators",
  });

  const { data: transfers, isLoading: isLoadingTransfers } = useQuery<BankTransferRequest[]>({
    queryKey: ["/api/admin/transfers", transferFilter],
    queryFn: async () => {
      const params = transferFilter !== "all" ? `?status=${transferFilter}` : "";
      const res = await fetch(`/api/admin/transfers${params}`);
      return res.json();
    },
    enabled: authStatus?.authenticated && activeTab === "transfers",
  });

  const { data: allUsers, isLoading: isLoadingUsers } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    enabled: authStatus?.authenticated && (activeTab === "users" || activeTab === "notifications"),
  });

  const [auditSearch, setAuditSearch] = useState("");
  const { data: auditUsers, isLoading: isLoadingAudit } = useQuery<any[]>({
    queryKey: ["/api/admin/user-audit"],
    enabled: authStatus?.authenticated && activeTab === "user-audit",
  });

  const { data: allVideos, isLoading: isLoadingVideos } = useQuery<VideoData[]>({
    queryKey: ["/api/admin/videos"],
    enabled: authStatus?.authenticated && activeTab === "content",
  });

  const { data: allProducts, isLoading: isLoadingProducts } = useQuery<ProductData[]>({
    queryKey: ["/api/admin/products"],
    enabled: authStatus?.authenticated && activeTab === "shop",
  });

  const { data: allOrders, isLoading: isLoadingOrders } = useQuery<OrderData[]>({
    queryKey: ["/api/admin/orders"],
    enabled: authStatus?.authenticated && activeTab === "shop",
  });

  const { data: allLiveStreams, isLoading: isLoadingLiveStreams } = useQuery<LiveStreamData[]>({
    queryKey: ["/api/admin/livestreams"],
    enabled: authStatus?.authenticated && activeTab === "livestreams",
  });

  const { data: allWithdrawals, isLoading: isLoadingWithdrawals } = useQuery<WithdrawalData[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: authStatus?.authenticated && activeTab === "withdrawals",
  });

  const { data: salesData, isLoading: isLoadingSales } = useQuery<SalesData>({
    queryKey: ["/api/admin/sales"],
    enabled: authStatus?.authenticated && activeTab === "sales",
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery<MessagesData>({
    queryKey: ["/api/admin/messages"],
    enabled: authStatus?.authenticated && activeTab === "messages",
  });

  const { data: inquiriesData, isLoading: isLoadingInquiries } = useQuery<InquiryData[]>({
    queryKey: ["/api/admin/inquiries"],
    enabled: authStatus?.authenticated && activeTab === "inquiries",
  });

  const { data: emailsData, isLoading: isLoadingEmails } = useQuery<Array<{
    id: number;
    from: string;
    subject: string;
    date: string;
    text: string;
    html: string;
  }>>({
    queryKey: ["/api/admin/emails"],
    enabled: authStatus?.authenticated && activeTab === "inquiries",
  });

  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery<NotificationsData>({
    queryKey: ["/api/admin/notifications"],
    enabled: authStatus?.authenticated && activeTab === "notifications",
  });

  const { data: moderationAlerts, isLoading: isLoadingModeration, refetch: refetchModeration } = useQuery<ModerationAlert[]>({
    queryKey: ["/api/admin/moderation"],
    enabled: authStatus?.authenticated && activeTab === "moderation",
  });

  const { data: moderationUnreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/moderation/unread-count"],
    enabled: authStatus?.authenticated,
  });

  const { data: siteSettingsData, isLoading: isLoadingSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
    enabled: authStatus?.authenticated && activeTab === "settings",
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auth/me"] });
      setLocation("/admin/login");
    },
  });

  const applicationDecision = useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: "approved" | "rejected"; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/creator-applications/${id}/decision`, { decision, notes });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/creator-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      setSelectedApplication(null);
      setRejectionNotes("");
      toast({ title: vars.decision === "approved" ? "承認しました" : "却下しました" });
    },
  });

  const confirmTransfer = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/transfers/${id}/confirm`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      setSelectedTransfer(null);
      toast({ title: "振込を承認しました" });
    },
  });

  const rejectTransfer = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/transfers/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      setSelectedTransfer(null);
      setRejectionNotes("");
      toast({ title: "振込を却下しました" });
    },
  });

  const approveWithdrawal = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/withdrawals/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({ title: "出金を承認しました" });
    },
  });

  const rejectWithdrawal = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/withdrawals/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({ title: "出金を却下しました" });
    },
  });

  const updatePoints = useMutation({
    mutationFn: async ({ id, points, reason }: { id: string; points: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/points`, { points, reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      setPointAdjustment(0);
      setPointReason("");
      toast({ title: "ポイントを更新しました" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      setSelectedUser(null);
      toast({ title: "ユーザーを削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const moderationAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approved" | "rejected" | "deleted" }) => {
      const res = await apiRequest("PATCH", `/api/admin/moderation/${id}/action`, { action });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/unread-count"] });
      const actionLabels = { approved: "承認", rejected: "非承認", deleted: "削除" };
      toast({ title: `コンテンツを${actionLabels[vars.action]}しました` });
    },
    onError: () => {
      toast({ title: "アクションに失敗しました", variant: "destructive" });
    },
  });

  const stopLiveStream = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/livestreams/${id}/stop`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/livestreams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({ title: "配信を強制終了しました" });
    },
    onError: () => {
      toast({ title: "配信の終了に失敗しました", variant: "destructive" });
    },
  });

  const deleteLiveStream = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/livestreams/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/livestreams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({ title: "配信を削除しました" });
    },
    onError: () => {
      toast({ title: "配信の削除に失敗しました", variant: "destructive" });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "ステータスを更新しました" });
    },
    onError: () => {
      toast({ title: "ステータスの更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteVideo = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/videos/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({ title: "動画を削除しました" });
    },
    onError: () => {
      toast({ title: "動画の削除に失敗しました", variant: "destructive" });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/products/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard/stats"] });
      toast({ title: "商品を削除しました" });
    },
    onError: () => {
      toast({ title: "商品の削除に失敗しました", variant: "destructive" });
    },
  });

  // Broadcast notification mutation
  const broadcastNotification = useMutation({
    mutationFn: async (data: { title: string; message: string; type: string; userIds?: string[]; sendEmail?: boolean; emailSubject?: string; emailBody?: string }) => {
      const res = await apiRequest("POST", "/api/admin/notifications/send", data);
      return res.json();
    },
    onSuccess: (data: { success: boolean; notificationCount: number; emailCount?: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ 
        title: "送信完了", 
        description: `通知: ${data.notificationCount}件${data.emailCount ? `、メール: ${data.emailCount}件` : ""}送信しました` 
      });
      setNotifTitle("");
      setNotifMessage("");
      setNotifSendEmail(false);
      setNotifEmailSubject("");
      setNotifEmailBody("");
      setNotifSelectedUsers([]);
      setNotifUserSearch("");
      setNotifAiPrompt("");
    },
    onError: () => {
      toast({ title: "送信に失敗しました", variant: "destructive" });
    },
  });

  // Generate notification content with AI
  const generateNotification = useMutation({
    mutationFn: async (data: { prompt: string; type: string; includeEmail: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/notifications/generate", data);
      return res.json();
    },
    onSuccess: (data: { title: string; message: string; emailSubject?: string; emailBody?: string }) => {
      setNotifTitle(data.title || "");
      setNotifMessage(data.message || "");
      if (data.emailSubject) setNotifEmailSubject(data.emailSubject);
      if (data.emailBody) setNotifEmailBody(data.emailBody);
      toast({ title: "AIが文章を生成しました" });
    },
    onError: () => {
      toast({ title: "生成に失敗しました", variant: "destructive" });
    },
  });

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("POST", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      setSettingsChanged(false);
      toast({ title: "設定を保存しました" });
    },
    onError: () => {
      toast({ title: "設定の保存に失敗しました", variant: "destructive" });
    },
  });

  // Populate settings form when data loads
  useEffect(() => {
    if (siteSettingsData) {
      setSettingsForm(siteSettingsData);
    }
  }, [siteSettingsData]);

  useEffect(() => {
    if (!isCheckingAuth && !authStatus?.authenticated) {
      setLocation("/admin/login");
    }
  }, [authStatus, isCheckingAuth, setLocation]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authStatus?.authenticated) {
    return null;
  }

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPoints = (points: number | null) => {
    return (points || 0).toLocaleString();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600"><Clock className="h-3 w-3 mr-1" />審査中</Badge>;
      case "approved":
      case "confirmed":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />承認済み</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" />却下</Badge>;
      default:
        return null;
    }
  };

  const filteredUsers = allUsers?.filter(user => {
    if (!userSearch) return true;
    const search = userSearch.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.username?.toLowerCase().includes(search) ||
      user.displayName?.toLowerCase().includes(search)
    );
  });

  const navItems = [
    { id: "dashboard" as Tab, label: "ダッシュボード", icon: LayoutDashboard },
    { id: "sales" as Tab, label: "売上管理", icon: TrendingUp },
    { id: "transfers" as Tab, label: "ポイント管理", icon: Wallet, badge: stats?.pendingTransfers },
    { id: "withdrawals" as Tab, label: "出金管理", icon: CreditCard, badge: stats?.pendingWithdrawals },
    { id: "users" as Tab, label: "ユーザー管理", icon: Users },
    { id: "user-audit" as Tab, label: "ユーザー監査", icon: Search },
    { id: "creators" as Tab, label: "申請管理", icon: FileCheck, badge: stats?.pendingApplications },
    { id: "livestreams" as Tab, label: "ライブ管理", icon: Radio, badge: stats?.activeLiveStreams },
    { id: "content" as Tab, label: "コンテンツ管理", icon: Video },
    { id: "shop" as Tab, label: "ショップ管理", icon: ShoppingBag },
    { id: "marketing" as Tab, label: "マーケティング", icon: Megaphone },
    { id: "messages" as Tab, label: "メッセージ管理", icon: MessageSquare },
    { id: "inquiries" as Tab, label: "お問い合わせ", icon: HelpCircle },
    { id: "notifications" as Tab, label: "通知管理", icon: Bell },
    { id: "moderation" as Tab, label: "AI審査", icon: ShieldAlert, badge: moderationUnreadCount?.count },
    { id: "ai-generate" as Tab, label: "AI画像生成", icon: Sparkles },
    { id: "settings" as Tab, label: "設定", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080810] flex text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-60 bg-[#0d0d1a] border-r border-white/[0.06]
        transform transition-transform duration-200 ease-in-out flex-shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-4 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={logoImage} alt="Only-U" className="h-9 w-9 object-contain rounded-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0d1a]" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white">Only-U Admin</h1>
                <p className="text-[10px] text-white/40 mt-0.5">管理コンソール</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-sm
                  ${activeTab === item.id 
                    ? "bg-white/10 text-white border border-white/20" 
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent"
                  }
                `}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${activeTab === item.id ? "text-white" : ""}`} />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-white/[0.06]">
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              ログアウト
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#080810]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 lg:px-6 py-3.5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-menu"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="flex items-center gap-2">
              {(() => {
                const current = navItems.find(n => n.id === activeTab);
                return current ? (
                  <>
                    <div className="h-6 w-6 rounded-md bg-white/15 flex items-center justify-center">
                      <current.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h2 className="text-sm font-semibold text-white">{current.label}</h2>
                  </>
                ) : null;
              })()}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {isLoadingStats ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Alert Section - Pending Actions */}
                  {((stats?.pendingApplications || 0) > 0 || (stats?.pendingTransfers || 0) > 0 || (stats?.pendingWithdrawals || 0) > 0) && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        対応が必要な項目
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(stats?.pendingApplications || 0) > 0 && (
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-sm text-white transition-all"
                            onClick={() => setActiveTab("creators")}
                            data-testid="quick-link-applications"
                          >
                            <FileCheck className="h-3.5 w-3.5 text-amber-400" />
                            クリエイター申請 {stats?.pendingApplications}件
                          </button>
                        )}
                        {(stats?.pendingTransfers || 0) > 0 && (
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-sm text-white transition-all"
                            onClick={() => setActiveTab("transfers")}
                            data-testid="quick-link-transfers"
                          >
                            <Wallet className="h-3.5 w-3.5 text-amber-400" />
                            振込確認待ち {stats?.pendingTransfers}件
                          </button>
                        )}
                        {(stats?.pendingWithdrawals || 0) > 0 && (
                          <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-sm text-white transition-all"
                            onClick={() => setActiveTab("withdrawals")}
                            data-testid="quick-link-withdrawals"
                          >
                            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                            出金申請 {stats?.pendingWithdrawals}件
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { tab: "users" as Tab, label: "ユーザー", icon: Users, value: stats?.totalUsers, sub: "登録ユーザー数", color: "text-white", bg: "from-white/15 to-white/5" },
                      { tab: "creators" as Tab, label: "クリエイター", icon: FileCheck, value: stats?.totalCreators, sub: "承認済み", color: "text-purple-400", bg: "from-purple-500/20 to-purple-500/5" },
                      { tab: "content" as Tab, label: "コンテンツ", icon: Video, value: stats?.totalVideos, sub: "動画本数", color: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5" },
                      { tab: "shop" as Tab, label: "ショップ", icon: ShoppingBag, value: stats?.totalProducts, sub: "出品商品数", color: "text-green-400", bg: "from-green-500/20 to-green-500/5" },
                      { tab: "livestreams" as Tab, label: "ライブ配信", icon: Radio, value: stats?.activeLiveStreams || 0, sub: "配信中", color: "text-red-400", bg: "from-red-500/20 to-red-500/5" },
                      { tab: "transfers" as Tab, label: "ポイント振込", icon: CreditCard, value: stats?.pendingTransfers || 0, sub: "確認待ち", color: "text-amber-400", bg: "from-amber-500/20 to-amber-500/5" },
                      { tab: "withdrawals" as Tab, label: "出金申請", icon: DollarSign, value: stats?.pendingWithdrawals || 0, sub: "処理待ち", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-500/5" },
                      { tab: "creators" as Tab, label: "申請審査", icon: Clock, value: stats?.pendingApplications || 0, sub: "審査待ち", color: "text-orange-400", bg: "from-orange-500/20 to-orange-500/5" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl p-4 text-left transition-all group"
                        onClick={() => setActiveTab(item.tab)}
                        data-testid={`card-stat-${item.tab}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-white/40 font-medium">{item.label}</span>
                          <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${item.bg} flex items-center justify-center`}>
                            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{(item.value ?? 0).toLocaleString()}</div>
                        <p className="text-xs text-white/30 mt-1">{item.sub}</p>
                      </button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">クイックアクション</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { tab: "notifications" as Tab, icon: Bell, label: "通知を送信", color: "text-white", bg: "from-white/15 to-white/5" },
                        { tab: "sales" as Tab, icon: BarChart3, label: "売上確認", color: "text-blue-400", bg: "from-blue-500/20 to-blue-500/5" },
                        { tab: "settings" as Tab, icon: Settings, label: "設定", color: "text-white/60", bg: "from-white/10 to-white/5" },
                      ].map(item => (
                        <button
                          key={item.tab}
                          className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-all"
                          onClick={() => setActiveTab(item.tab)}
                          data-testid={`quick-action-${item.tab}`}
                        >
                          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center`}>
                            <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                          </div>
                          <span className="text-xs text-white/70 font-medium">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Management Sections Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {[
                      {
                        tab: "users" as Tab, title: "ユーザー管理",
                        rows: [
                          { label: "総ユーザー", value: stats?.totalUsers.toLocaleString() },
                          { label: "クリエイター", value: stats?.totalCreators.toLocaleString() },
                          { label: "審査待ち申請", badge: stats?.pendingApplications || 0, urgent: !!(stats?.pendingApplications) },
                        ]
                      },
                      {
                        tab: "content" as Tab, title: "コンテンツ管理",
                        rows: [
                          { label: "動画コンテンツ", value: stats?.totalVideos.toLocaleString() },
                          { label: "商品", value: stats?.totalProducts.toLocaleString() },
                          { label: "ライブ配信中", badge: stats?.activeLiveStreams || 0, urgent: !!(stats?.activeLiveStreams), pulse: true },
                        ]
                      },
                      {
                        tab: "transfers" as Tab, title: "ポイント・出金",
                        rows: [
                          { label: "振込確認待ち", badge: stats?.pendingTransfers || 0, urgent: !!(stats?.pendingTransfers) },
                          { label: "出金申請待ち", badge: stats?.pendingWithdrawals || 0, urgent: !!(stats?.pendingWithdrawals) },
                        ]
                      },
                      {
                        tab: "notifications" as Tab, title: "コミュニケーション",
                        actions: [
                          { label: "通知送信", tab: "notifications" as Tab, icon: Send },
                        ]
                      },
                    ].map(section => (
                      <div key={section.tab} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white">{section.title}</h4>
                          <button
                            className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
                            onClick={() => setActiveTab(section.tab)}
                          >
                            詳細 <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {section.rows?.map((row) => (
                            <div key={row.label} className="flex items-center justify-between">
                              <span className="text-xs text-white/40">{row.label}</span>
                              {row.badge !== undefined ? (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.urgent ? "bg-white/20 text-white" : "bg-white/10 text-white/50"} ${'pulse' in row && row.pulse ? "animate-pulse" : ""}`}>
                                  {row.badge}
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-white">{row.value}</span>
                              )}
                            </div>
                          ))}
                          {section.actions?.map((action) => (
                            <div key={action.label} className="flex items-center justify-between">
                              <span className="text-xs text-white/40">{action.label}</span>
                              <button
                                className="flex items-center gap-1 text-xs text-white/60 hover:text-white px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-all"
                                onClick={() => setActiveTab(action.tab)}
                              >
                                <action.icon className="h-3 w-3" /> 開く
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Applications */}
          {activeTab === "creators" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["pending", "approved", "rejected", "all"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={applicationFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setApplicationFilter(status)}
                    data-testid={`filter-app-${status}`}
                  >
                    {status === "pending" && "審査中"}
                    {status === "approved" && "承認済み"}
                    {status === "rejected" && "却下"}
                    {status === "all" && "すべて"}
                  </Button>
                ))}
              </div>

              {isLoadingApps ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : applications && applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <Card key={app.id} className="cursor-pointer hover-elevate" onClick={() => setSelectedApplication(app)}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{app.fullName || app.userId}</span>
                              {getStatusBadge(app.status)}
                            </div>
                            {app.username && (
                              <p className="text-sm text-muted-foreground mt-1">@{app.username}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              申請日: {formatDate(app.submittedAt)}
                            </p>
                            {app.email && (
                              <p className="text-sm text-muted-foreground">{app.email}</p>
                            )}
                          </div>
                          {app.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applicationDecision.mutate({ id: app.id, decision: "approved" });
                                }}
                                disabled={applicationDecision.isPending}
                                data-testid={`approve-${app.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                承認
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApplication(app);
                                }}
                                disabled={applicationDecision.isPending}
                                data-testid={`reject-${app.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                却下
                              </Button>
                            </div>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  申請がありません
                </div>
              )}
            </div>
          )}

          {/* Transfers */}
          {activeTab === "transfers" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ポイント購入（銀行振込）</CardTitle>
                  <p className="text-sm text-muted-foreground">ユーザーがポイントを購入するための振込申請</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(["pending", "confirmed", "rejected", "all"] as const).map((status) => (
                      <Button
                        key={status}
                        variant={transferFilter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTransferFilter(status)}
                        data-testid={`filter-transfer-${status}`}
                      >
                        {status === "pending" && "審査中"}
                        {status === "confirmed" && "承認済み"}
                        {status === "rejected" && "却下"}
                        {status === "all" && "すべて"}
                      </Button>
                    ))}
                  </div>

                  {isLoadingTransfers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : transfers && transfers.length > 0 ? (
                    <div className="space-y-3">
                      {transfers.map((transfer) => (
                        <div key={transfer.id} className="p-4 border rounded-lg cursor-pointer hover-elevate" onClick={() => setSelectedTransfer(transfer)} data-testid={`card-transfer-${transfer.id}`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{(transfer as any).userName || transfer.accountName || "不明なユーザー"}</span>
                                {getStatusBadge(transfer.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatPoints(transfer.points)} ポイント ({formatPoints(transfer.amount)}円)
                              </p>
                              <p className="text-sm text-muted-foreground">
                                申請日: {formatDate(transfer.createdAt)} | 期限: {formatDate(transfer.transferDeadline)}
                              </p>
                            </div>
                            {transfer.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransferToConfirm(transfer);
                                  }}
                                  disabled={confirmTransfer.isPending}
                                  data-testid={`confirm-${transfer.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  承認
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTransfer(transfer);
                                  }}
                                  disabled={rejectTransfer.isPending}
                                  data-testid={`reject-transfer-${transfer.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  却下
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      振込申請がありません
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Withdrawals */}
          {activeTab === "withdrawals" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">クリエイター出金申請</CardTitle>
                  <p className="text-sm text-muted-foreground">クリエイターが売上を現金として引き出すための申請</p>
                </CardHeader>
                <CardContent>
                  {isLoadingWithdrawals ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : allWithdrawals && allWithdrawals.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">クリエイター</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">申請金額</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">手数料</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">振込金額</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">銀行情報</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ステータス</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">申請日</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">振込日</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allWithdrawals.map((withdrawal: any) => (
                            <tr key={withdrawal.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-withdrawal-${withdrawal.id}`}>
                              <td className="p-3 text-sm">
                                <div className="font-medium">{withdrawal.userName}</div>
                                {withdrawal.creatorApplication && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <div>本名: {withdrawal.creatorApplication.fullName}</div>
                                    <div>電話: {withdrawal.creatorApplication.phoneNumber}</div>
                                    {withdrawal.creatorApplication.portfolioUrl && (
                                      <a href={withdrawal.creatorApplication.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                        ポートフォリオ
                                      </a>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-sm font-medium">¥{withdrawal.amount.toLocaleString()}</td>
                              <td className="p-3 text-sm text-muted-foreground">¥{withdrawal.fee.toLocaleString()}</td>
                              <td className="p-3 text-sm font-medium text-green-600">¥{withdrawal.netAmount.toLocaleString()}</td>
                              <td className="p-3 text-sm">
                                <div>{withdrawal.bankName}</div>
                                <div className="text-xs text-muted-foreground">{withdrawal.bankBranchName}</div>
                                <div className="text-xs text-muted-foreground">{withdrawal.bankAccountType} {withdrawal.bankAccountNumber}</div>
                                <div className="text-xs text-muted-foreground">{withdrawal.bankAccountHolder}</div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  <Badge variant={withdrawal.status === "pending" ? "secondary" : withdrawal.status === "completed" ? "default" : "destructive"}>
                                    {withdrawal.status === "pending" ? "保留中" : withdrawal.status === "completed" ? "完了" : "却下"}
                                  </Badge>
                                  <Badge variant={withdrawal.isEarly ? "destructive" : "outline"} className="text-xs">
                                    {withdrawal.isEarly ? "早払い" : "通常"}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(withdrawal.createdAt)}</td>
                              <td className="p-3 text-sm text-muted-foreground">{withdrawal.processedAt ? formatDate(withdrawal.processedAt) : "-"}</td>
                              <td className="p-3">
                                {withdrawal.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => approveWithdrawal.mutate(withdrawal.id)}
                                      disabled={approveWithdrawal.isPending}
                                      data-testid={`approve-withdrawal-${withdrawal.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      承認
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-300"
                                      onClick={() => rejectWithdrawal.mutate(withdrawal.id)}
                                      disabled={rejectWithdrawal.isPending}
                                      data-testid={`reject-withdrawal-${withdrawal.id}`}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      却下
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">出金申請がありません</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sales */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              {isLoadingSales ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : salesData ? (
                <>
                  {/* 純利益サマリー */}
                  <Card className="border-2 border-white/30" data-testid="card-net-profit">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">プラットフォーム純利益</p>
                          <p className="text-4xl font-bold text-white" data-testid="text-net-profit">
                            ¥{salesData.netProfit.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">プラットフォーム総収益</p>
                          <p className="text-2xl font-bold" data-testid="text-total-platform-revenue">
                            ¥{salesData.totalPlatformRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* クリエイター売上内訳 */}
                    <Card data-testid="card-creator-revenue">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          クリエイター売上内訳
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">サブスク売上</span>
                          <span className="font-medium" data-testid="text-sub-revenue">¥{salesData.creatorRevenue.subscription.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">ライブ売上</span>
                          <span className="font-medium" data-testid="text-live-revenue">¥{salesData.creatorRevenue.live.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">ショップ売上</span>
                          <span className="font-medium" data-testid="text-shop-revenue">¥{salesData.creatorRevenue.shop.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-2">({salesData.creatorRevenue.shopCount}件)</span>
                        </div>
                        <div className="flex justify-between items-center py-2 bg-slate-100 dark:bg-slate-800 rounded px-2">
                          <span className="font-bold">クリエイター総売上</span>
                          <span className="font-bold text-lg" data-testid="text-creator-total-revenue">¥{salesData.creatorRevenue.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* クリエイター支払い経費（プラットフォーム収入） */}
                    <Card data-testid="card-creator-expenses">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          クリエイター支払い経費
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">（プラットフォーム収入）</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-xs text-muted-foreground mb-2 px-1">
                          対象金額: ¥{salesData.creatorPaymentExpenses.feeBaseAmount.toLocaleString()}
                        </div>
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="text-muted-foreground">システム利用料 (15%)</span>
                          <span className="font-medium" data-testid="text-system-fee">¥{salesData.creatorPaymentExpenses.systemFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b pl-4">
                          <span className="text-xs text-muted-foreground">└ 消費税 (10%)</span>
                          <span className="text-sm" data-testid="text-system-fee-tax">¥{salesData.creatorPaymentExpenses.systemFeeTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b">
                          <div>
                            <span className="text-muted-foreground">早払い手数料 (8%)</span>
                            {salesData.creatorPaymentExpenses.earlyPaymentCount > 0 && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({salesData.creatorPaymentExpenses.earlyPaymentCount}件 / ¥{salesData.creatorPaymentExpenses.earlyPaymentAmount.toLocaleString()})
                              </span>
                            )}
                          </div>
                          <span className="font-medium" data-testid="text-early-fee">¥{salesData.creatorPaymentExpenses.earlyPaymentFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b pl-4">
                          <span className="text-xs text-muted-foreground">└ 消費税 (10%)</span>
                          <span className="text-sm" data-testid="text-early-fee-tax">¥{salesData.creatorPaymentExpenses.earlyPaymentFeeTax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="text-muted-foreground">振込手数料 (¥330/件)</span>
                          <div>
                            <span className="font-medium" data-testid="text-transfer-fee">¥{salesData.creatorPaymentExpenses.transferFee.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground ml-2">({salesData.creatorPaymentExpenses.transferCount}件)</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2 bg-green-100 dark:bg-green-900/30 rounded px-2 mt-2">
                          <span className="font-bold text-green-700 dark:text-green-400">経費収入合計</span>
                          <span className="font-bold text-lg text-green-700 dark:text-green-400" data-testid="text-expense-total">¥{salesData.creatorPaymentExpenses.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ポイント購入収益 */}
                    <Card data-testid="card-point-purchase">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <DollarSign className="h-5 w-5" />
                          ポイント購入
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="text-muted-foreground">銀行振込</span>
                          <span className="font-medium" data-testid="text-bank-transfer">¥{salesData.pointPurchase.bankTransfer.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-2">({salesData.pointPurchase.bankTransferCount}件)</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="text-muted-foreground">カード決済 (Stripe)</span>
                          <span className="font-medium" data-testid="text-stripe">¥{salesData.pointPurchase.stripe.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-2">({salesData.pointPurchase.stripeCount}件)</span>
                        </div>
                        <div className="flex justify-between items-center py-2 bg-slate-100 dark:bg-slate-800 rounded px-2">
                          <span className="font-bold">ポイント購入総額</span>
                          <span className="font-bold" data-testid="text-point-total">¥{salesData.pointPurchase.total.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-2">({salesData.pointPurchase.totalCount}件)</span>
                        </div>
                        <div className="mt-4 pt-2 border-t">
                          <p className="text-sm font-medium mb-2">手数料収入</p>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground">購入手数料 (10%)</span>
                            <span className="font-medium" data-testid="text-point-fee">¥{salesData.pointPurchase.fee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 pl-4">
                            <span className="text-xs text-muted-foreground">└ 消費税 (10%)</span>
                            <span className="text-sm" data-testid="text-point-fee-tax">¥{salesData.pointPurchase.feeTax.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 bg-green-100 dark:bg-green-900/30 rounded px-2 mt-2">
                            <span className="font-bold text-green-700 dark:text-green-400">手数料収入合計</span>
                            <span className="font-bold text-lg text-green-700 dark:text-green-400" data-testid="text-point-revenue">¥{salesData.pointPurchase.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 収益サマリー */}
                    <Card data-testid="card-revenue-summary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          収益サマリー
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">クリエイター経費収入</span>
                          <span className="font-medium text-green-600" data-testid="text-summary-expense">+¥{salesData.creatorPaymentExpenses.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-muted-foreground">ポイント手数料収入</span>
                          <span className="font-medium text-green-600" data-testid="text-summary-point">+¥{salesData.pointPurchase.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-white/10 rounded px-3">
                          <span className="font-bold text-white">純利益</span>
                          <span className="font-bold text-2xl text-white" data-testid="text-summary-net-profit">¥{salesData.netProfit.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 取引履歴 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">最近の取引履歴</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {salesData.recentTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">カテゴリ</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">ユーザー</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">クリエイター</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">金額</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">説明</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">日時</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesData.recentTransactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-transaction-${tx.id}`}>
                                  <td className="p-3">
                                    <Badge 
                                      variant="secondary" 
                                      className={
                                        tx.category === "platform_subscription" ? "bg-white/10 text-white" :
                                        tx.category === "subscription" ? "bg-purple-500/10 text-purple-600" :
                                        tx.category === "live" ? "bg-red-500/10 text-red-600" :
                                        tx.category === "shop" ? "bg-blue-500/10 text-blue-600" :
                                        "bg-green-500/10 text-green-600"
                                      }
                                      data-testid={`badge-transaction-category-${tx.id}`}
                                    >
                                      {tx.category === "platform_subscription" ? "自社サブスク" :
                                       tx.category === "subscription" ? "サブスク" :
                                       tx.category === "live" ? "ライブ" :
                                       tx.category === "shop" ? "ショップ" :
                                       "ポイント"}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm" data-testid={`text-transaction-user-${tx.id}`}>{tx.userName}</td>
                                  <td className="p-3 text-sm" data-testid={`text-transaction-creator-${tx.id}`}>{tx.creatorName || "-"}</td>
                                  <td className="p-3 text-sm font-medium">
                                    <span className={tx.amount > 0 ? "text-green-600" : "text-red-600"} data-testid={`text-transaction-amount-${tx.id}`}>
                                      {tx.amount > 0 ? "+" : ""}{Math.abs(tx.amount).toLocaleString()} pt
                                    </span>
                                  </td>
                                  <td className="p-3 text-sm text-muted-foreground">{tx.description || "-"}</td>
                                  <td className="p-3 text-sm text-muted-foreground">{formatDate(tx.createdAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">取引履歴がありません</div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">データの読み込みに失敗しました</div>
              )}
            </div>
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="space-y-4">
              {isLoadingMessages ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : messagesData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card data-testid="card-total-messages">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総メッセージ数</p>
                        <p className="text-2xl font-bold" data-testid="text-total-messages">{messagesData.totalMessages.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-total-conversations">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総会話数</p>
                        <p className="text-2xl font-bold" data-testid="text-total-conversations">{messagesData.totalConversations.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">最近のメッセージ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {messagesData.recentMessages.length > 0 ? (
                        <div className="space-y-3">
                          {messagesData.recentMessages.slice(0, 20).map((msg) => (
                            <div key={msg.id} className="p-3 border rounded-lg" data-testid={`card-message-${msg.id}`}>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm" data-testid={`text-sender-${msg.id}`}>{msg.senderName}</span>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm" data-testid={`text-recipient-${msg.id}`}>{msg.recipientName}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">メッセージがありません</div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">データの読み込みに失敗しました</div>
              )}
            </div>
          )}

          {/* Inquiries / Emails */}
          {activeTab === "inquiries" && (
            <div className="space-y-4">
              {/* Hostinger Mailbox */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    メールボックス
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{emailsData?.length || 0}件</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/emails"] })}
                      data-testid="button-refresh-emails"
                    >
                      更新
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingEmails ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : emailsData && emailsData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">差出人</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">件名</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">受信日時</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailsData.map((email) => (
                            <tr key={email.id} className="border-b border-slate-100 dark:border-slate-800 hover-elevate cursor-pointer" data-testid={`row-email-${email.id}`} onClick={() => setSelectedEmail(email)}>
                              <td className="p-3 text-sm font-medium truncate max-w-[200px]">{email.from}</td>
                              <td className="p-3 text-sm truncate max-w-[300px]">{email.subject}</td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(email.date)}</td>
                              <td className="p-3">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedEmail(email); }}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  詳細
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">メールがありません</div>
                  )}
                </CardContent>
              </Card>

              {/* Email Detail Dialog */}
              <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedEmail?.subject || "メール詳細"}</DialogTitle>
                    <DialogDescription>
                      差出人: {selectedEmail?.from}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      受信日時: {selectedEmail?.date ? formatDate(selectedEmail.date) : "-"}
                    </div>
                    <Separator />
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {selectedEmail?.html ? (
                        <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm">{selectedEmail?.text}</pre>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* System Inquiries */}
              {inquiriesData && inquiriesData.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                    <CardTitle className="text-lg">システムお問い合わせ</CardTitle>
                    <Badge variant="secondary">{inquiriesData.length}件</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">名前</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">メール</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">件名</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ステータス</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">受信日</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inquiriesData.map((inquiry) => (
                            <tr key={inquiry.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-inquiry-${inquiry.id}`}>
                              <td className="p-3 text-sm font-medium" data-testid={`text-inquiry-name-${inquiry.id}`}>{inquiry.name}</td>
                              <td className="p-3 text-sm">{inquiry.email}</td>
                              <td className="p-3 text-sm">{inquiry.subject}</td>
                              <td className="p-3">
                                <Badge variant={inquiry.status === "new" ? "destructive" : inquiry.status === "responded" ? "default" : "secondary"} data-testid={`badge-inquiry-status-${inquiry.id}`}>
                                  {inquiry.status === "new" ? "未対応" : inquiry.status === "responded" ? "対応済" : "処理中"}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(inquiry.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              {isLoadingNotifications ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card data-testid="card-total-notifications">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総通知数</p>
                        <p className="text-2xl font-bold" data-testid="text-total-notifications">{notificationsData?.totalNotifications.toLocaleString() || 0}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-unread-notifications">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">未読通知</p>
                        <p className="text-2xl font-bold text-white" data-testid="text-unread-notifications">{notificationsData?.unreadNotifications.toLocaleString() || 0}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        通知・メール送信
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>送信先</Label>
                          <Select value={notifTarget} onValueChange={(v: "all" | "specific") => setNotifTarget(v)}>
                            <SelectTrigger data-testid="select-notif-target">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">全ユーザー</SelectItem>
                              <SelectItem value="specific">特定ユーザー</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>通知タイプ</Label>
                          <Select value={notifType} onValueChange={setNotifType}>
                            <SelectTrigger data-testid="select-notif-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="system">システム</SelectItem>
                              <SelectItem value="announcement">お知らせ</SelectItem>
                              <SelectItem value="promotion">プロモーション</SelectItem>
                              <SelectItem value="maintenance">メンテナンス</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {notifTarget === "specific" && (
                        <div className="space-y-2">
                          <Label>ユーザー選択</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="ユーザーを検索..."
                              value={notifUserSearch}
                              onChange={(e) => setNotifUserSearch(e.target.value)}
                              className="pl-10"
                              data-testid="input-notif-user-search"
                            />
                          </div>
                          {notifSelectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {notifSelectedUsers.map((userId) => {
                                const user = allUsers?.find(u => u.id === userId);
                                return (
                                  <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                    {user?.displayName || user?.username || userId.slice(0, 8)}
                                    <X 
                                      className="h-3 w-3 cursor-pointer" 
                                      onClick={() => setNotifSelectedUsers(prev => prev.filter(id => id !== userId))}
                                    />
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          {notifUserSearch && allUsers && (
                            <div className="border rounded-md max-h-40 overflow-y-auto">
                              {allUsers
                                .filter(u => 
                                  (u.displayName?.toLowerCase().includes(notifUserSearch.toLowerCase()) ||
                                   u.username?.toLowerCase().includes(notifUserSearch.toLowerCase()) ||
                                   u.email?.toLowerCase().includes(notifUserSearch.toLowerCase())) &&
                                  !notifSelectedUsers.includes(u.id)
                                )
                                .slice(0, 10)
                                .map(user => (
                                  <div 
                                    key={user.id}
                                    className="p-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                                    onClick={() => {
                                      setNotifSelectedUsers(prev => [...prev, user.id]);
                                      setNotifUserSearch("");
                                    }}
                                    data-testid={`option-user-${user.id}`}
                                  >
                                    <span className="text-sm">{user.displayName || user.username}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-3 p-4 border border-white/10 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Sparkles className="h-4 w-4 text-white" />
                          AI文章生成
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="どんな通知を送りたいか説明してください（例: 新機能リリースのお知らせ、メンテナンス告知など）"
                            value={notifAiPrompt}
                            onChange={(e) => setNotifAiPrompt(e.target.value)}
                            rows={2}
                            data-testid="textarea-ai-prompt"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!notifAiPrompt.trim()) {
                                toast({ title: "生成したい内容を入力してください", variant: "destructive" });
                                return;
                              }
                              generateNotification.mutate({
                                prompt: notifAiPrompt,
                                type: notifType,
                                includeEmail: notifSendEmail,
                              });
                            }}
                            disabled={generateNotification.isPending}
                            className="w-full"
                            data-testid="button-generate-ai"
                          >
                            {generateNotification.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            AIで文章を生成
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="notif-title">通知タイトル</Label>
                        <Input
                          id="notif-title"
                          placeholder="通知のタイトルを入力"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          data-testid="input-notif-title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notif-message">通知メッセージ</Label>
                        <Textarea
                          id="notif-message"
                          placeholder="通知の内容を入力"
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          rows={3}
                          data-testid="textarea-notif-message"
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="send-email"
                          checked={notifSendEmail}
                          onCheckedChange={(checked) => setNotifSendEmail(checked === true)}
                          data-testid="checkbox-send-email"
                        />
                        <Label htmlFor="send-email" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="h-4 w-4" />
                          メールも同時に送信する
                        </Label>
                      </div>

                      {notifSendEmail && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                          <div className="space-y-2">
                            <Label htmlFor="email-subject">メール件名</Label>
                            <Input
                              id="email-subject"
                              placeholder="メールの件名を入力"
                              value={notifEmailSubject}
                              onChange={(e) => setNotifEmailSubject(e.target.value)}
                              data-testid="input-email-subject"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email-body">メール本文</Label>
                            <Textarea
                              id="email-body"
                              placeholder="メールの本文を入力"
                              value={notifEmailBody}
                              onChange={(e) => setNotifEmailBody(e.target.value)}
                              rows={5}
                              data-testid="textarea-email-body"
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => {
                          if (!notifTitle || !notifMessage) {
                            toast({ title: "タイトルとメッセージを入力してください", variant: "destructive" });
                            return;
                          }
                          if (notifTarget === "specific" && notifSelectedUsers.length === 0) {
                            toast({ title: "送信先ユーザーを選択してください", variant: "destructive" });
                            return;
                          }
                          if (notifSendEmail && (!notifEmailSubject || !notifEmailBody)) {
                            toast({ title: "メールの件名と本文を入力してください", variant: "destructive" });
                            return;
                          }
                          broadcastNotification.mutate({
                            title: notifTitle,
                            message: notifMessage,
                            type: notifType,
                            userIds: notifTarget === "specific" ? notifSelectedUsers : undefined,
                            sendEmail: notifSendEmail,
                            emailSubject: notifEmailSubject || undefined,
                            emailBody: notifEmailBody || undefined,
                          });
                        }}
                        disabled={broadcastNotification.isPending}
                        className="w-full"
                        data-testid="button-send-notification"
                      >
                        {broadcastNotification.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {notifTarget === "all" ? "全ユーザーに送信" : `${notifSelectedUsers.length}人に送信`}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">最近の通知</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {notificationsData && notificationsData.recentNotifications.length > 0 ? (
                        <div className="space-y-3">
                          {notificationsData.recentNotifications.slice(0, 20).map((notif) => (
                            <div key={notif.id} className="p-3 border rounded-lg" data-testid={`card-notification-${notif.id}`}>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm" data-testid={`text-notification-title-${notif.id}`}>{notif.title}</span>
                                  <Badge variant={notif.isRead ? "secondary" : "destructive"} className="text-xs" data-testid={`badge-notification-status-${notif.id}`}>
                                    {notif.isRead ? "既読" : "未読"}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(notif.createdAt)}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{notif.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">通知がありません</div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* AI Content Moderation */}
          {activeTab === "moderation" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  AI審査アラート
                </h2>
                {moderationUnreadCount && moderationUnreadCount.count > 0 && (
                  <Badge variant="destructive" data-testid="badge-moderation-unread">
                    未対応 {moderationUnreadCount.count}件
                  </Badge>
                )}
              </div>

              {isLoadingModeration ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : moderationAlerts && moderationAlerts.length > 0 ? (
                <div className="space-y-3">
                  {moderationAlerts.map((alert) => (
                    <Card 
                      key={alert.id} 
                      className={`${!alert.isRead ? "border-l-4 border-l-red-500" : ""}`}
                      data-testid={`card-moderation-${alert.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={alert.severity === "high" ? "destructive" : alert.severity === "medium" ? "default" : "secondary"}
                                data-testid={`badge-severity-${alert.id}`}
                              >
                                {alert.severity === "high" ? "高" : alert.severity === "medium" ? "中" : "低"}
                              </Badge>
                              <Badge variant="outline">
                                {alert.contentType === "video" ? "動画" : alert.contentType === "live" ? "ライブ" : alert.contentType === "product" ? "商品" : "メッセージ"}
                              </Badge>
                              {alert.actionTaken && (
                                <Badge variant={alert.actionTaken === "approved" ? "default" : alert.actionTaken === "deleted" ? "destructive" : "secondary"}>
                                  {alert.actionTaken === "approved" ? "承認済" : alert.actionTaken === "rejected" ? "非承認" : "削除済"}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{formatDate(alert.createdAt)}</span>
                            </div>
                            <h3 className="font-medium text-sm mb-1" data-testid={`text-alert-title-${alert.id}`}>{alert.title}</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{alert.message}</p>
                          </div>
                          {!alert.actionTaken && (
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moderationAction.mutate({ id: alert.id, action: "approved" })}
                                disabled={moderationAction.isPending}
                                data-testid={`button-approve-${alert.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                承認
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moderationAction.mutate({ id: alert.id, action: "rejected" })}
                                disabled={moderationAction.isPending}
                                data-testid={`button-reject-${alert.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                非承認
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={moderationAction.isPending}
                                    data-testid={`button-delete-${alert.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    削除
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>コンテンツを削除しますか？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      このコンテンツを完全に削除します。この操作は取り消せません。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => moderationAction.mutate({ id: alert.id, action: "deleted" })}
                                    >
                                      削除する
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>審査アラートはありません</p>
                    <p className="text-sm mt-2">AIがコンテンツを自動審査し、違反の可能性があるものを検出します</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Users */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ユーザーを検索..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-user-search"
                />
              </div>

              {isLoadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ユーザー</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">メール</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ポイント</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">クリエイター獲得</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">登録日</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-user-${user.id}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <span className="text-sm font-medium text-white">
                                    {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium text-sm">{user.displayName || user.username || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">@{user.username || user.id.slice(0, 8)}</p>
                                </div>
                                {user.isCreator && (
                                  <Badge variant="secondary" className="text-xs">クリエイター</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{user.email || "-"}</td>
                          <td className="p-3 text-sm font-medium">{formatPoints(user.points)}</td>
                          <td className="p-3 text-sm font-medium">
                            {user.isCreator ? (
                              <span className="text-green-600">{formatPoints(user.creatorEarnings)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`manage-user-${user.id}`}
                              >
                                管理
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    data-testid={`delete-user-${user.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      「{user.displayName || user.username || user.email}」を削除します。この操作は取り消せません。関連するすべてのデータ（投稿、購入履歴、ポイントなど）も削除されます。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser.mutate(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      削除する
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  ユーザーが見つかりません
                </div>
              )}
            </div>
          )}

          {/* User Audit */}
          {activeTab === "user-audit" && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="メール・ユーザー名・IDで検索..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-audit-search"
                />
              </div>

              {isLoadingAudit ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {(auditUsers || [])
                    .filter((u: any) => {
                      if (!auditSearch) return true;
                      const s = auditSearch.toLowerCase();
                      return (
                        u.email?.toLowerCase().includes(s) ||
                        u.username?.toLowerCase().includes(s) ||
                        u.displayName?.toLowerCase().includes(s) ||
                        u.id?.toLowerCase().includes(s)
                      );
                    })
                    .map((u: any) => (
                      <Card key={u.id} className="bg-[#0d0d1a] border-white/10" data-testid={`card-audit-user-${u.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.displayName || u.username || u.email} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white font-bold text-sm">{(u.displayName || u.username || u.email || "?")[0].toUpperCase()}</span>
                                )}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0d0d1a] ${u.isOnline ? "bg-green-500" : "bg-white/20"}`} data-testid={`status-online-${u.id}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white" data-testid={`text-audit-name-${u.id}`}>{u.displayName || u.username || "未設定"}</span>
                                {u.username && <span className="text-xs text-white/50">@{u.username}</span>}
                                {u.isOnline ? (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1" data-testid={`badge-online-${u.id}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                                    オンライン
                                  </span>
                                ) : (
                                  <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full" data-testid={`badge-offline-${u.id}`}>オフライン</span>
                                )}
                                {u.isCreator && (
                                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">クリエイター</span>
                                )}
                              </div>
                              <div className="text-xs text-white/60 mt-0.5" data-testid={`text-audit-email-${u.id}`}>{u.email || "メールなし"}</div>
                              <div className="text-xs text-white/40 font-mono" data-testid={`text-audit-id-${u.id}`}>ID: {u.id}</div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                <div className="bg-white/5 rounded p-2 text-center">
                                  <div className="text-lg font-bold text-white" data-testid={`text-audit-points-${u.id}`}>{(u.points || 0).toLocaleString()}</div>
                                  <div className="text-xs text-white/50">ポイント</div>
                                </div>
                                <div className="bg-white/5 rounded p-2 text-center">
                                  <div className="text-lg font-bold text-white" data-testid={`text-audit-tx-${u.id}`}>{u.transactionCount}</div>
                                  <div className="text-xs text-white/50">取引回数</div>
                                </div>
                                <div className="bg-white/5 rounded p-2 text-center">
                                  <div className="text-lg font-bold text-white" data-testid={`text-audit-purchases-${u.id}`}>{u.purchaseCount}</div>
                                  <div className="text-xs text-white/50">購入数</div>
                                </div>
                                <div className="bg-white/5 rounded p-2 text-center">
                                  <div className="text-lg font-bold text-white" data-testid={`text-audit-follows-${u.id}`}>{u.followCount}</div>
                                  <div className="text-xs text-white/50">フォロー数</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3 text-xs">
                                {u.lastIpAddress && (
                                  <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1.5">
                                    <Activity className="h-3 w-3 text-white/40 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-white/40 text-[10px]">最終IPアドレス</div>
                                      <div className="text-white font-mono truncate" data-testid={`text-audit-ip-${u.id}`}>{u.lastIpAddress}</div>
                                    </div>
                                  </div>
                                )}
                                {u.lastSeenAt && (
                                  <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1.5">
                                    <Clock className="h-3 w-3 text-white/40 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-white/40 text-[10px]">最終ログイン</div>
                                      <div className="text-white" data-testid={`text-audit-lastseen-${u.id}`}>{new Date(u.lastSeenAt).toLocaleString("ja-JP")}</div>
                                    </div>
                                  </div>
                                )}
                                {u.location && (
                                  <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1.5">
                                    <MapPin className="h-3 w-3 text-white/40 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-white/40 text-[10px]">所在地（自己申告）</div>
                                      <div className="text-white" data-testid={`text-audit-location-${u.id}`}>{u.location}</div>
                                    </div>
                                  </div>
                                )}
                                {u.phoneNumber && (
                                  <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1.5">
                                    <Phone className="h-3 w-3 text-white/40 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-white/40 text-[10px]">電話番号</div>
                                      <div className="text-white" data-testid={`text-audit-phone-${u.id}`}>{u.phoneNumber}</div>
                                    </div>
                                  </div>
                                )}
                                {u.birthdate && (
                                  <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1.5">
                                    <Calendar className="h-3 w-3 text-white/40 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <div className="text-white/40 text-[10px]">生年月日</div>
                                      <div className="text-white" data-testid={`text-audit-birth-${u.id}`}>{new Date(u.birthdate).toLocaleDateString("ja-JP")}</div>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 bg-white/5 rounded px-2 py-1.5">
                                  <Users className="h-3 w-3 text-white/40 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="text-white/40 text-[10px]">登録日</div>
                                    <div className="text-white" data-testid={`text-audit-created-${u.id}`}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("ja-JP") : "不明"}</div>
                                  </div>
                                </div>
                              </div>

                              {u.recentTransactions && u.recentTransactions.length > 0 && (
                                <div className="mt-3 border-t border-white/10 pt-3">
                                  <div className="text-xs text-white/40 mb-2">直近の取引</div>
                                  <div className="space-y-1">
                                    {u.recentTransactions.slice(0, 3).map((tx: any) => (
                                      <div key={tx.id} className="flex items-center justify-between text-xs" data-testid={`row-audit-tx-${tx.id}`}>
                                        <span className="text-white/60 truncate max-w-[60%]">{tx.description || tx.type}</span>
                                        <span className={tx.amount > 0 ? "text-white font-medium" : "text-white/50"}>
                                          {tx.amount > 0 ? "+" : ""}{tx.amount}pt
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {(auditUsers || []).length === 0 && !isLoadingAudit && (
                    <div className="text-center py-12 text-white/50">ユーザーが見つかりません</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Videos */}
          {activeTab === "content" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-lg">動画一覧</CardTitle>
                  <Badge variant="secondary">{allVideos?.length || 0}件</Badge>
                </CardHeader>
                <CardContent>
                  {isLoadingVideos ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : allVideos && allVideos.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">タイトル</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">クリエイター</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">視聴数</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">タイプ</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">投稿日</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allVideos.map((video) => (
                            <tr key={video.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-video-${video.id}`}>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-16 h-10 object-cover rounded" />
                                  ) : (
                                    <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                      <Video className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <p className="font-medium text-sm truncate max-w-[200px]">{video.title}</p>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{video.creatorName}</td>
                              <td className="p-3 text-sm">{video.viewCount.toLocaleString()}</td>
                              <td className="p-3">
                                <Badge variant={video.isPremium ? "default" : "secondary"}>
                                  {video.isPremium ? "プレミアム" : "無料"}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(video.createdAt)}</td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`/video/${video.id}`, "_blank")}
                                    data-testid={`view-video-${video.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    視聴
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive" data-testid={`delete-video-${video.id}`}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>動画を削除しますか？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          「{video.title}」を削除します。この操作は取り消せません。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteVideo.mutate(video.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          削除
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">動画がありません</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products */}
          {activeTab === "shop" && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-lg">商品一覧</CardTitle>
                  <Badge variant="secondary">{allProducts?.length || 0}件</Badge>
                </CardHeader>
                <CardContent>
                  {isLoadingProducts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : allProducts && allProducts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">商品名</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">クリエイター</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">価格</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">販売数</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">獲得ポイント</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">在庫</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">タイプ</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allProducts.map((product) => (
                            <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-product-${product.id}`}>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                  ) : (
                                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{product.creatorName}</td>
                              <td className="p-3 text-sm font-medium">{product.price.toLocaleString()}pt</td>
                              <td className="p-3 text-sm font-medium" data-testid={`text-sales-count-${product.id}`}>{product.salesCount}件</td>
                              <td className="p-3 text-sm font-medium text-green-600" data-testid={`text-earnings-${product.id}`}>{product.totalEarnings.toLocaleString()}pt</td>
                              <td className="p-3 text-sm">{product.stock !== null ? product.stock : "∞"}</td>
                              <td className="p-3">
                                <Badge variant="secondary">
                                  {product.productType === "digital" ? "デジタル" : "物理"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(`/shop/${product.id}`, "_blank")}
                                    data-testid={`view-product-${product.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    詳細
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive" data-testid={`delete-product-${product.id}`}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>商品を削除しますか？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          「{product.name}」を削除します。この操作は取り消せません。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteProduct.mutate(product.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          削除
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">商品がありません</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-lg">注文一覧</CardTitle>
                  <Badge variant="secondary">{allOrders?.length || 0}件</Badge>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : allOrders && allOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">商品</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">購入者</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">クリエイター</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">金額</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">タイプ</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ステータス</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">配送先</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">購入日</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allOrders.map((order) => (
                            <tr key={order.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-order-${order.id}`}>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  {order.productImageUrl ? (
                                    <img src={order.productImageUrl} alt={order.productName || ""} className="w-10 h-10 object-cover rounded" />
                                  ) : (
                                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <p className="font-medium text-sm truncate max-w-[150px]">{order.productName || "不明"}</p>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{order.buyerName}</td>
                              <td className="p-3 text-sm">{order.creatorName}</td>
                              <td className="p-3 text-sm font-medium">{order.price.toLocaleString()}pt</td>
                              <td className="p-3">
                                <Badge variant="outline">
                                  {order.productType === "digital" ? "デジタル" : "物理"}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {order.productType === "physical" ? (
                                  <Select
                                    value={order.status || "pending"}
                                    onValueChange={(value) => updateOrderStatus.mutate({ id: order.id, status: value })}
                                  >
                                    <SelectTrigger className="w-28 h-8" data-testid={`select-status-${order.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">未発送</SelectItem>
                                      <SelectItem value="shipped">発送済</SelectItem>
                                      <SelectItem value="completed">完了</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge variant="default">提供済</Badge>
                                )}
                              </td>
                              <td className="p-3 text-xs">
                                {order.productType === "physical" && order.shippingName ? (
                                  <div className="space-y-1">
                                    <p>{order.shippingName}</p>
                                    <p className="text-muted-foreground">〒{order.shippingPostalCode}</p>
                                    <p className="text-muted-foreground truncate max-w-[150px]">{order.shippingAddress}</p>
                                    {order.shippingPhone && <p className="text-muted-foreground">{order.shippingPhone}</p>}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(order.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">注文がありません</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Live Streams */}
          {activeTab === "livestreams" && (
            <div className="space-y-4">
              {/* Live streams summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">配信中</p>
                    <p className="text-2xl font-bold text-red-500">
                      {allLiveStreams?.filter(s => s.status === "live").length || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">予定</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {allLiveStreams?.filter(s => s.status === "scheduled").length || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">総視聴者数</p>
                    <p className="text-2xl font-bold">
                      {allLiveStreams?.reduce((sum, s) => sum + (s.viewerCount || 0), 0).toLocaleString() || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                  <CardTitle className="text-lg">ライブ配信一覧</CardTitle>
                  <Badge variant="secondary">{allLiveStreams?.length || 0}件</Badge>
                </CardHeader>
                <CardContent>
                  {isLoadingLiveStreams ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : allLiveStreams && allLiveStreams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">タイトル</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">クリエイター</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ステータス</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">視聴者</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">開始日時</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allLiveStreams.map((stream) => (
                            <tr key={stream.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-stream-${stream.id}`}>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  {stream.thumbnailUrl ? (
                                    <img src={stream.thumbnailUrl} alt={stream.title} className="w-16 h-10 object-cover rounded" />
                                  ) : (
                                    <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                                      <Radio className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <p className="font-medium text-sm truncate max-w-[200px]">{stream.title}</p>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{stream.creatorName}</td>
                              <td className="p-3">
                                <Badge variant={stream.status === "live" ? "default" : "secondary"} className={stream.status === "live" ? "bg-red-500" : ""}>
                                  {stream.status === "live" ? "配信中" : stream.status === "scheduled" ? "予定" : "終了"}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">{stream.viewerCount.toLocaleString()}</td>
                              <td className="p-3 text-sm text-muted-foreground">{stream.startedAt ? formatDate(stream.startedAt) : "-"}</td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  {(stream.status === "live" || stream.status === "scheduled") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/live/${stream.id}`, "_blank")}
                                      data-testid={`view-stream-${stream.id}`}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      視聴
                                    </Button>
                                  )}
                                  {stream.status === "live" && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-300" data-testid={`stop-stream-${stream.id}`}>
                                          <Ban className="h-4 w-4 mr-1" />
                                          強制終了
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>配信を強制終了しますか？</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            「{stream.title}」を強制終了します。視聴者は切断されます。
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => stopLiveStream.mutate(stream.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            強制終了
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive" data-testid={`delete-stream-${stream.id}`}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>配信を削除しますか？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          「{stream.title}」を削除します。この操作は取り消せません。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteLiveStream.mutate(stream.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          削除
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">ライブ配信がありません</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Marketing */}
          {activeTab === "marketing" && <AdminMarketing />}

          {/* AI Image Generation */}
          {activeTab === "ai-generate" && <VeniceImageGenerator />}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {isLoadingSettings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {settingsChanged && (
                    <div className="sticky top-0 z-10 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">変更が保存されていません</p>
                      <Button
                        onClick={() => saveSettings.mutate(settingsForm)}
                        disabled={saveSettings.isPending}
                        data-testid="button-save-settings"
                      >
                        {saveSettings.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        保存する
                      </Button>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">サイト情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="site_name">サイト名</Label>
                          <Input
                            id="site_name"
                            value={settingsForm.site_name || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, site_name: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-site-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="support_email">サポートメール</Label>
                          <Input
                            id="support_email"
                            type="email"
                            value={settingsForm.support_email || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, support_email: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-support-email"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="site_description">サイト説明</Label>
                        <Textarea
                          id="site_description"
                          value={settingsForm.site_description || ""}
                          onChange={(e) => {
                            setSettingsForm(prev => ({ ...prev, site_description: e.target.value }));
                            setSettingsChanged(true);
                          }}
                          rows={3}
                          data-testid="textarea-site-description"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">アプリDLリンク</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="apple_store_url">App Store URL（iOS）</Label>
                          <Input
                            id="apple_store_url"
                            placeholder="https://apps.apple.com/..."
                            value={settingsForm.apple_store_url || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, apple_store_url: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-apple-store-url"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="google_play_url">Google Play URL（Android）</Label>
                          <Input
                            id="google_play_url"
                            placeholder="https://play.google.com/..."
                            value={settingsForm.google_play_url || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, google_play_url: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-google-play-url"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">システム設定</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">メンテナンスモード</p>
                          <p className="text-sm text-muted-foreground">サイトをメンテナンスモードにします</p>
                        </div>
                        <Select
                          value={settingsForm.maintenance_mode || "false"}
                          onValueChange={(v) => {
                            setSettingsForm(prev => ({ ...prev, maintenance_mode: v }));
                            setSettingsChanged(true);
                          }}
                        >
                          <SelectTrigger className="w-24" data-testid="select-maintenance-mode">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">オフ</SelectItem>
                            <SelectItem value="true">オン</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">新規登録</p>
                          <p className="text-sm text-muted-foreground">新規ユーザー登録を許可します</p>
                        </div>
                        <Select
                          value={settingsForm.allow_registration || "true"}
                          onValueChange={(v) => {
                            setSettingsForm(prev => ({ ...prev, allow_registration: v }));
                            setSettingsChanged(true);
                          }}
                        >
                          <SelectTrigger className="w-24" data-testid="select-allow-registration">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">有効</SelectItem>
                            <SelectItem value="false">無効</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">クリエイター申請</p>
                          <p className="text-sm text-muted-foreground">新規クリエイター申請を許可します</p>
                        </div>
                        <Select
                          value={settingsForm.allow_creator_application || "true"}
                          onValueChange={(v) => {
                            setSettingsForm(prev => ({ ...prev, allow_creator_application: v }));
                            setSettingsChanged(true);
                          }}
                        >
                          <SelectTrigger className="w-24" data-testid="select-allow-creator-application">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">有効</SelectItem>
                            <SelectItem value="false">無効</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">手数料設定</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="platform_fee_percent">プラットフォーム手数料 (%)</Label>
                          <Input
                            id="platform_fee_percent"
                            type="number"
                            value={settingsForm.platform_fee_percent || "20"}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, platform_fee_percent: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-platform-fee"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="early_payment_fee_percent">早期出金手数料 (%)</Label>
                          <Input
                            id="early_payment_fee_percent"
                            type="number"
                            value={settingsForm.early_payment_fee_percent || "8"}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, early_payment_fee_percent: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-early-payment-fee"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="withdrawal_fee">出金手数料 (円)</Label>
                          <Input
                            id="withdrawal_fee"
                            type="number"
                            value={settingsForm.withdrawal_fee || "330"}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, withdrawal_fee: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-withdrawal-fee"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="min_withdrawal">最低出金額 (円)</Label>
                          <Input
                            id="min_withdrawal"
                            type="number"
                            value={settingsForm.min_withdrawal || "5000"}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, min_withdrawal: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-min-withdrawal"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">法的情報</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="terms_url">利用規約 URL</Label>
                          <Input
                            id="terms_url"
                            value={settingsForm.terms_url || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, terms_url: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-terms-url"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="privacy_url">プライバシーポリシー URL</Label>
                          <Input
                            id="privacy_url"
                            value={settingsForm.privacy_url || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, privacy_url: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-privacy-url"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tokusho_registration_number">特商法 許認可番号</Label>
                          <Input
                            id="tokusho_registration_number"
                            placeholder="例: 第〇〇号"
                            value={settingsForm.tokusho_registration_number || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, tokusho_registration_number: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-tokusho-number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tokusho_authority">許認可機関名</Label>
                          <Input
                            id="tokusho_authority"
                            placeholder="例: 神奈川県公安委員会"
                            value={settingsForm.tokusho_authority || ""}
                            onChange={(e) => {
                              setSettingsForm(prev => ({ ...prev, tokusho_authority: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            data-testid="input-tokusho-authority"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-medium mb-3">性風俗・古物商 届出番号</p>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="eizou_fuuei_number">映像送信型性風俗特殊営業届出</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">神奈川県公安委員会第</span>
                              <Input
                                id="eizou_fuuei_number"
                                placeholder="〇〇〇〇"
                                value={settingsForm.eizou_fuuei_number || ""}
                                onChange={(e) => {
                                  setSettingsForm(prev => ({ ...prev, eizou_fuuei_number: e.target.value }));
                                  setSettingsChanged(true);
                                }}
                                data-testid="input-eizou-fuuei-number"
                              />
                              <span className="text-sm text-muted-foreground">号</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="muten_fuuei_number">無店舗型性風俗特殊営業届出</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">神奈川県公安委員会第</span>
                              <Input
                                id="muten_fuuei_number"
                                placeholder="〇〇〇〇"
                                value={settingsForm.muten_fuuei_number || ""}
                                onChange={(e) => {
                                  setSettingsForm(prev => ({ ...prev, muten_fuuei_number: e.target.value }));
                                  setSettingsChanged(true);
                                }}
                                data-testid="input-muten-fuuei-number"
                              />
                              <span className="text-sm text-muted-foreground">号</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="kobutsu_number">古物商許可</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">神奈川県公安委員会第</span>
                              <Input
                                id="kobutsu_number"
                                placeholder="〇〇〇〇"
                                value={settingsForm.kobutsu_number || ""}
                                onChange={(e) => {
                                  setSettingsForm(prev => ({ ...prev, kobutsu_number: e.target.value }));
                                  setSettingsChanged(true);
                                }}
                                data-testid="input-kobutsu-number"
                              />
                              <span className="text-sm text-muted-foreground">号</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveSettings.mutate(settingsForm)}
                      disabled={saveSettings.isPending || !settingsChanged}
                      data-testid="button-save-settings-bottom"
                    >
                      {saveSettings.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      設定を保存
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Application detail dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>クリエイター申請詳細</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">氏名</p>
                  <p className="font-medium">{selectedApplication.fullName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ステータス</p>
                  {getStatusBadge(selectedApplication.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">メールアドレス</p>
                  <p className="font-medium">{selectedApplication.email || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">電話番号</p>
                  <p className="font-medium">{selectedApplication.phoneNumber || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">住所</p>
                  <p className="font-medium">
                    〒{selectedApplication.postalCode} {selectedApplication.prefecture}{selectedApplication.city}{selectedApplication.address} {selectedApplication.building}
                  </p>
                </div>
              </div>

              {selectedApplication.portfolioUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ポートフォリオ</p>
                  <a
                    href={selectedApplication.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {selectedApplication.portfolioUrl}
                  </a>
                </div>
              )}

              {/* eKYC Documents */}
              {(selectedApplication.idDocumentFrontUrl || selectedApplication.idDocumentBackUrl || selectedApplication.selfieUrl) && (
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">本人確認書類（eKYC）</p>
                    {selectedApplication.idDocumentType && (
                      <p className="text-xs text-muted-foreground mb-2">書類種別: {selectedApplication.idDocumentType}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {selectedApplication.idDocumentFrontUrl && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">表面</p>
                          <a href={selectedApplication.idDocumentFrontUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={selectedApplication.idDocumentFrontUrl}
                              alt="ID Front"
                              className="w-full h-20 object-cover rounded border hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          </a>
                        </div>
                      )}
                      {selectedApplication.idDocumentBackUrl && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">裏面</p>
                          <a href={selectedApplication.idDocumentBackUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={selectedApplication.idDocumentBackUrl}
                              alt="ID Back"
                              className="w-full h-20 object-cover rounded border hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          </a>
                        </div>
                      )}
                      {selectedApplication.selfieUrl && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">顔写真</p>
                          <a href={selectedApplication.selfieUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={selectedApplication.selfieUrl}
                              alt="Selfie"
                              className="w-full h-20 object-cover rounded border hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedApplication.status === "pending" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>却下理由（任意）</Label>
                    <Textarea
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="却下理由を入力..."
                      data-testid="input-rejection-notes"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => applicationDecision.mutate({ id: selectedApplication.id, decision: "approved" })}
                      disabled={applicationDecision.isPending}
                    >
                      承認
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300"
                      onClick={() => applicationDecision.mutate({ id: selectedApplication.id, decision: "rejected", notes: rejectionNotes })}
                      disabled={applicationDecision.isPending}
                    >
                      却下
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer detail dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={(open) => !open && setSelectedTransfer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>振込申請詳細</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">振込名義</p>
                  <p className="font-medium">{selectedTransfer.accountName || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ステータス</p>
                  {getStatusBadge(selectedTransfer.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">ポイント数</p>
                  <p className="font-medium">{formatPoints(selectedTransfer.points)} pt</p>
                </div>
                <div>
                  <p className="text-muted-foreground">金額</p>
                  <p className="font-medium">¥{formatPoints(selectedTransfer.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">申請日</p>
                  <p className="font-medium">{formatDate(selectedTransfer.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">期限</p>
                  <p className="font-medium">{formatDate(selectedTransfer.transferDeadline)}</p>
                </div>
              </div>

              {selectedTransfer.status === "pending" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>却下理由（却下時のみ）</Label>
                    <Textarea
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="却下理由を入力..."
                      data-testid="input-transfer-rejection-notes"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => confirmTransfer.mutate(selectedTransfer.id)}
                      disabled={confirmTransfer.isPending}
                    >
                      承認（ポイント付与）
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300"
                      onClick={() => rejectTransfer.mutate({ id: selectedTransfer.id, reason: rejectionNotes })}
                      disabled={rejectTransfer.isPending}
                    >
                      却下
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User management dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ユーザー管理</DialogTitle>
            <DialogDescription>
              {selectedUser?.displayName || selectedUser?.username || "ユーザー"}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ユーザーID</p>
                  <p className="font-medium text-xs break-all">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">現在のポイント</p>
                  <p className="font-medium text-lg">{formatPoints(selectedUser.points)} pt</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>ポイント調整</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setPointAdjustment(prev => prev - 100)}
                    data-testid="button-decrease-points"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={pointAdjustment}
                    onChange={(e) => setPointAdjustment(parseInt(e.target.value) || 0)}
                    className="text-center"
                    data-testid="input-point-adjustment"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setPointAdjustment(prev => prev + 100)}
                    data-testid="button-increase-points"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>調整理由</Label>
                  <Input
                    value={pointReason}
                    onChange={(e) => setPointReason(e.target.value)}
                    placeholder="例: キャンペーン付与"
                    data-testid="input-point-reason"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (pointAdjustment !== 0) {
                      updatePoints.mutate({
                        id: selectedUser.id,
                        points: pointAdjustment,
                        reason: pointReason,
                      });
                    }
                  }}
                  disabled={pointAdjustment === 0 || updatePoints.isPending}
                  data-testid="button-apply-points"
                >
                  {updatePoints.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  ポイントを{pointAdjustment >= 0 ? "付与" : "減算"}する
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Confirmation Dialog */}
      <AlertDialog open={!!transferToConfirm} onOpenChange={(open) => !open && setTransferToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>銀行振込の確認</AlertDialogTitle>
            <AlertDialogDescription>
              銀行振り込みを確認できましたか？
              <br /><br />
              <span className="font-medium">
                ユーザー: {transferToConfirm && ((transferToConfirm as any).userName || transferToConfirm.accountName || "不明")}
              </span>
              <br />
              <span className="font-medium">
                金額: ¥{transferToConfirm && formatPoints(transferToConfirm.amount)} → {transferToConfirm && formatPoints(transferToConfirm.points)}pt
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (transferToConfirm) {
                  confirmTransfer.mutate(transferToConfirm.id);
                  setTransferToConfirm(null);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              確認済み・承認する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
