import { useState, useEffect } from "react";
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

type Tab = "dashboard" | "sales" | "marketing" | "users" | "creators" | "livestreams" | "content" | "shop" | "messages" | "transfers" | "withdrawals" | "inquiries" | "notifications" | "settings";

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

interface SalesData {
  creatorRevenue: {
    subscription: number;
    live: number;
    shop: number;
    shopCount: number;
    total: number;
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
    userId: string;
    userName: string;
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
  
  // Marketing email state
  const [emailTargetAudience, setEmailTargetAudience] = useState("");
  const [emailPurpose, setEmailPurpose] = useState("");
  const [emailTone, setEmailTone] = useState("フレンドリー");
  const [emailAdditionalInfo, setEmailAdditionalInfo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
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
    queryKey: ["/api/admin/applications", applicationFilter],
    queryFn: async () => {
      const params = applicationFilter !== "all" ? `?status=${applicationFilter}` : "";
      const res = await fetch(`/api/admin/applications${params}`);
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

  const { data: allVideos, isLoading: isLoadingVideos } = useQuery<VideoData[]>({
    queryKey: ["/api/admin/videos"],
    enabled: authStatus?.authenticated && activeTab === "content",
  });

  const { data: allProducts, isLoading: isLoadingProducts } = useQuery<ProductData[]>({
    queryKey: ["/api/admin/products"],
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

  const { data: marketingData, isLoading: isLoadingMarketing } = useQuery<MarketingData>({
    queryKey: ["/api/admin/marketing"],
    enabled: authStatus?.authenticated && activeTab === "marketing",
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
      const res = await apiRequest("PATCH", `/api/admin/applications/${id}/decision`, { decision, notes });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
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

  // Marketing users query
  const { data: marketingUsers, isLoading: isLoadingMarketingUsers } = useQuery<Array<{id: string; displayName: string | null; email: string | null; createdAt: Date | null}>>({
    queryKey: ["/api/admin/marketing/users"],
    enabled: authStatus?.authenticated && activeTab === "marketing",
  });

  // Generate email mutation
  const generateEmail = useMutation({
    mutationFn: async (data: { targetAudience: string; purpose: string; tone: string; additionalInfo: string }) => {
      const res = await apiRequest("POST", "/api/admin/marketing/generate-email", data);
      return res.json();
    },
    onSuccess: (data: { subject: string; body: string }) => {
      setEmailSubject(data.subject || "");
      setEmailBody(data.body || "");
      toast({ title: "メールを生成しました" });
    },
    onError: () => {
      toast({ title: "メール生成に失敗しました", variant: "destructive" });
    },
  });

  // Send email mutation
  const sendEmail = useMutation({
    mutationFn: async (data: { recipients: string[]; subject: string; body: string }) => {
      const res = await apiRequest("POST", "/api/admin/marketing/send-email", data);
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({ title: data.message || "送信しました" });
      setSelectedRecipients([]);
      setEmailSubject("");
      setEmailBody("");
    },
    onError: () => {
      toast({ title: "メール送信に失敗しました", variant: "destructive" });
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
    },
    onError: () => {
      toast({ title: "送信に失敗しました", variant: "destructive" });
    },
  });

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
    { id: "withdrawals" as Tab, label: "クリエイター出金管理", icon: CreditCard, badge: stats?.pendingWithdrawals },
    { id: "marketing" as Tab, label: "マーケティング管理", icon: Megaphone },
    { id: "users" as Tab, label: "ユーザー管理", icon: Users },
    { id: "creators" as Tab, label: "クリエイター申請・管理", icon: FileCheck, badge: stats?.pendingApplications },
    { id: "livestreams" as Tab, label: "ライブ管理", icon: Radio, badge: stats?.activeLiveStreams },
    { id: "content" as Tab, label: "コンテンツ管理", icon: Video },
    { id: "shop" as Tab, label: "ショップ管理", icon: ShoppingBag },
    { id: "messages" as Tab, label: "メッセージ管理", icon: MessageSquare },
    { id: "inquiries" as Tab, label: "お問い合わせ管理", icon: HelpCircle },
    { id: "notifications" as Tab, label: "通知管理", icon: Bell },
    { id: "settings" as Tab, label: "設定", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Only-U" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="font-bold text-lg">Only-U</h1>
                <p className="text-xs text-muted-foreground">管理パネル</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${activeTab === item.id 
                    ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400" 
                    : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }
                `}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="secondary" className="bg-pink-500 text-white text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 dark:text-slate-300"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5 mr-3" />
              ログアウト
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {isLoadingStats ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">総ユーザー数</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">クリエイター数</CardTitle>
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalCreators.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">審査待ち申請</CardTitle>
                      <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{stats?.pendingApplications}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">振込待ち</CardTitle>
                      <Wallet className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{stats?.pendingTransfers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">動画コンテンツ</CardTitle>
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalVideos.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">商品数</CardTitle>
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.totalProducts.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
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
                  <Card className="border-2 border-pink-500" data-testid="card-net-profit">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">プラットフォーム純利益</p>
                          <p className="text-4xl font-bold text-pink-600" data-testid="text-net-profit">
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
                        <div className="flex justify-between items-center py-3 bg-pink-100 dark:bg-pink-900/30 rounded px-3">
                          <span className="font-bold text-pink-700 dark:text-pink-400">純利益</span>
                          <span className="font-bold text-2xl text-pink-700 dark:text-pink-400" data-testid="text-summary-net-profit">¥{salesData.netProfit.toLocaleString()}</span>
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
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">ユーザー</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">種類</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">金額</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">説明</th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">日時</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesData.recentTransactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800" data-testid={`row-transaction-${tx.id}`}>
                                  <td className="p-3 text-sm" data-testid={`text-transaction-user-${tx.id}`}>{tx.userName}</td>
                                  <td className="p-3">
                                    <Badge variant={tx.type === "purchase" ? "default" : "secondary"} data-testid={`badge-transaction-type-${tx.id}`}>
                                      {tx.type === "purchase" ? "購入" : tx.type === "use" ? "使用" : tx.type}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm font-medium">
                                    <span className={tx.amount > 0 ? "text-green-600" : "text-red-600"} data-testid={`text-transaction-amount-${tx.id}`}>
                                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()} pt
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

          {/* Marketing */}
          {activeTab === "marketing" && (
            <div className="space-y-6">
              {isLoadingMarketing ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : marketingData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card data-testid="card-total-users">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総ユーザー数</p>
                        <p className="text-2xl font-bold" data-testid="text-total-users">{marketingData.totalUsers.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-new-users">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">今月の新規登録</p>
                        <p className="text-2xl font-bold text-green-600" data-testid="text-new-users">{marketingData.newUsersThisMonth.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-total-follows">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">フォロー総数</p>
                        <p className="text-2xl font-bold" data-testid="text-total-follows">{marketingData.totalFollows.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-active-subscriptions">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">アクティブサブスクリプション</p>
                        <p className="text-2xl font-bold text-pink-600" data-testid="text-active-subscriptions">{marketingData.activeSubscriptions.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-video-views">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">動画総再生数</p>
                        <p className="text-2xl font-bold" data-testid="text-video-views">{marketingData.totalVideoViews.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card data-testid="card-video-likes">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">動画総いいね数</p>
                        <p className="text-2xl font-bold" data-testid="text-video-likes">{marketingData.totalVideoLikes.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* AI Marketing Email Section */}
                  <Card data-testid="card-marketing-email">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        AI営業メール作成
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* AI Generation Form */}
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h4 className="font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          AIでメール内容を生成
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>ターゲット</Label>
                            <Input
                              data-testid="input-email-target"
                              placeholder="例: 新規登録ユーザー、休眠ユーザー"
                              value={emailTargetAudience}
                              onChange={(e) => setEmailTargetAudience(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>目的</Label>
                            <Input
                              data-testid="input-email-purpose"
                              placeholder="例: 新機能のお知らせ、キャンペーン告知"
                              value={emailPurpose}
                              onChange={(e) => setEmailPurpose(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>トーン</Label>
                            <Select value={emailTone} onValueChange={setEmailTone}>
                              <SelectTrigger data-testid="select-email-tone">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="フレンドリー">フレンドリー</SelectItem>
                                <SelectItem value="フォーマル">フォーマル</SelectItem>
                                <SelectItem value="カジュアル">カジュアル</SelectItem>
                                <SelectItem value="緊急">緊急</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>追加情報（任意）</Label>
                            <Input
                              data-testid="input-email-additional"
                              placeholder="例: 期間限定50%オフ"
                              value={emailAdditionalInfo}
                              onChange={(e) => setEmailAdditionalInfo(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button
                          data-testid="button-generate-email"
                          onClick={() => generateEmail.mutate({
                            targetAudience: emailTargetAudience,
                            purpose: emailPurpose,
                            tone: emailTone,
                            additionalInfo: emailAdditionalInfo,
                          })}
                          disabled={generateEmail.isPending}
                          className="w-full"
                        >
                          {generateEmail.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              AIでメールを生成
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Email Content */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>件名</Label>
                          <Input
                            data-testid="input-email-subject"
                            placeholder="メールの件名"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>本文</Label>
                          <Textarea
                            data-testid="textarea-email-body"
                            placeholder="メールの本文"
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={10}
                            className="resize-none"
                          />
                        </div>
                      </div>

                      {/* Recipients Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>送信先を選択</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="button-select-all"
                              onClick={() => {
                                if (marketingUsers) {
                                  setSelectedRecipients(marketingUsers.map(u => u.email!).filter(Boolean));
                                }
                              }}
                            >
                              全て選択
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="button-deselect-all"
                              onClick={() => setSelectedRecipients([])}
                            >
                              選択解除
                            </Button>
                          </div>
                        </div>
                        
                        {isLoadingMarketingUsers ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : marketingUsers && marketingUsers.length > 0 ? (
                          <div className="border rounded-lg max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted sticky top-0">
                                <tr>
                                  <th className="p-2 text-left w-10">
                                    <Checkbox
                                      checked={selectedRecipients.length === marketingUsers.filter(u => u.email).length && selectedRecipients.length > 0}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedRecipients(marketingUsers.map(u => u.email!).filter(Boolean));
                                        } else {
                                          setSelectedRecipients([]);
                                        }
                                      }}
                                    />
                                  </th>
                                  <th className="p-2 text-left">表示名</th>
                                  <th className="p-2 text-left">メールアドレス</th>
                                </tr>
                              </thead>
                              <tbody>
                                {marketingUsers.filter(u => u.email).map((user) => (
                                  <tr key={user.id} className="border-t hover-elevate">
                                    <td className="p-2">
                                      <Checkbox
                                        data-testid={`checkbox-recipient-${user.id}`}
                                        checked={selectedRecipients.includes(user.email!)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedRecipients([...selectedRecipients, user.email!]);
                                          } else {
                                            setSelectedRecipients(selectedRecipients.filter(e => e !== user.email));
                                          }
                                        }}
                                      />
                                    </td>
                                    <td className="p-2">{user.displayName || "-"}</td>
                                    <td className="p-2 font-mono text-xs">{user.email}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">送信可能なユーザーがいません</div>
                        )}
                        
                        <p className="text-sm text-muted-foreground">
                          選択中: {selectedRecipients.length}件
                        </p>
                      </div>

                      {/* Send Button */}
                      <Button
                        data-testid="button-send-email"
                        onClick={() => sendEmail.mutate({
                          recipients: selectedRecipients,
                          subject: emailSubject,
                          body: emailBody,
                        })}
                        disabled={sendEmail.isPending || selectedRecipients.length === 0 || !emailSubject || !emailBody}
                        className="w-full"
                      >
                        {sendEmail.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            送信中...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            {selectedRecipients.length}件にメールを送信
                          </>
                        )}
                      </Button>
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
                                <span className="font-medium text-sm" data-testid={`text-sender-${msg.id}`}>{msg.senderName}</span>
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
                        <p className="text-2xl font-bold text-pink-600" data-testid="text-unread-notifications">{notificationsData?.unreadNotifications.toLocaleString() || 0}</p>
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
                              <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <span className="text-sm font-medium text-pink-600">
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

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">プラットフォーム設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">メンテナンスモード</p>
                      <p className="text-sm text-muted-foreground">サイトをメンテナンスモードにします</p>
                    </div>
                    <Badge variant="secondary">オフ</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">新規登録</p>
                      <p className="text-sm text-muted-foreground">新規ユーザー登録を許可します</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">有効</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">クリエイター申請</p>
                      <p className="text-sm text-muted-foreground">新規クリエイター申請を許可します</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">有効</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">手数料設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">プラットフォーム手数料</p>
                      <p className="text-sm text-muted-foreground">売上からのプラットフォーム手数料率</p>
                    </div>
                    <Badge variant="secondary">20%</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">出金手数料</p>
                      <p className="text-sm text-muted-foreground">出金時の手数料</p>
                    </div>
                    <Badge variant="secondary">¥300</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">最低出金額</p>
                      <p className="text-sm text-muted-foreground">出金可能な最低金額</p>
                    </div>
                    <Badge variant="secondary">¥5,000</Badge>
                  </div>
                </CardContent>
              </Card>
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
