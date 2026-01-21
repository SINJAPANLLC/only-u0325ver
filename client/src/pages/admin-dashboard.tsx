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
} from "lucide-react";
import type { CreatorApplication, BankTransferRequest } from "@shared/schema";
import logoImage from "@assets/IMG_9769_1768973936225.PNG";

type Tab = "dashboard" | "sales" | "marketing" | "users" | "creators" | "livestreams" | "content" | "shop" | "messages" | "transfers" | "inquiries" | "notifications" | "settings";

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
  creatorId: string;
  creatorName: string;
  status: string;
  viewerCount: number;
  startedAt: string | null;
}

interface WithdrawalData {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: string;
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
}

interface SalesData {
  subscriptionRevenue: number;
  productSalesTotal: number;
  productSalesCount: number;
  pointPurchasesTotal: number;
  pointPurchasesCount: number;
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
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [pointAdjustment, setPointAdjustment] = useState(0);
  const [pointReason, setPointReason] = useState("");

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

  const { data: applications, isLoading: isLoadingApps } = useQuery<CreatorApplication[]>({
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
    enabled: authStatus?.authenticated && activeTab === "users",
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
    enabled: authStatus?.authenticated && activeTab === "transfers",
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
    { id: "marketing" as Tab, label: "マーケティング管理", icon: Megaphone },
    { id: "users" as Tab, label: "ユーザー管理", icon: Users },
    { id: "creators" as Tab, label: "クリエイター申請・管理", icon: FileCheck, badge: stats?.pendingApplications },
    { id: "livestreams" as Tab, label: "ライブ管理", icon: Radio, badge: stats?.activeLiveStreams },
    { id: "content" as Tab, label: "コンテンツ管理", icon: Video },
    { id: "shop" as Tab, label: "ショップ管理", icon: ShoppingBag },
    { id: "messages" as Tab, label: "メッセージ管理", icon: MessageSquare },
    { id: "transfers" as Tab, label: "振込申請・管理", icon: Wallet, badge: stats?.pendingTransfers },
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
                  <CardTitle className="text-lg">ポイント購入申請（振込）</CardTitle>
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
                        <div key={transfer.id} className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setSelectedTransfer(transfer)}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{transfer.accountName || transfer.userId.slice(0, 8)}</span>
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
                                    confirmTransfer.mutate(transfer.id);
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">出金申請</CardTitle>
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
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ユーザー</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">金額</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">銀行</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">ステータス</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">申請日</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allWithdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 text-sm font-medium">{withdrawal.userName}</td>
                              <td className="p-3 text-sm font-medium">¥{withdrawal.amount.toLocaleString()}</td>
                              <td className="p-3 text-sm">{withdrawal.bankName}</td>
                              <td className="p-3">
                                <Badge variant={withdrawal.status === "pending" ? "secondary" : withdrawal.status === "completed" ? "default" : "destructive"}>
                                  {withdrawal.status === "pending" ? "保留中" : withdrawal.status === "completed" ? "完了" : "却下"}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(withdrawal.createdAt)}</td>
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
            <div className="space-y-4">
              {isLoadingSales ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : salesData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">サブスクリプション収益</p>
                        <p className="text-2xl font-bold">¥{salesData.subscriptionRevenue.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">商品売上</p>
                        <p className="text-2xl font-bold">¥{salesData.productSalesTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{salesData.productSalesCount}件</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">ポイント購入（振込）</p>
                        <p className="text-2xl font-bold">¥{salesData.pointPurchasesTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{salesData.pointPurchasesCount}件</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">合計売上</p>
                        <p className="text-2xl font-bold text-pink-600">
                          ¥{(salesData.subscriptionRevenue + salesData.productSalesTotal + salesData.pointPurchasesTotal).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
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
                                <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800">
                                  <td className="p-3 text-sm">{tx.userName}</td>
                                  <td className="p-3">
                                    <Badge variant={tx.type === "purchase" ? "default" : "secondary"}>
                                      {tx.type === "purchase" ? "購入" : tx.type === "use" ? "使用" : tx.type}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm font-medium">
                                    <span className={tx.amount > 0 ? "text-green-600" : "text-red-600"}>
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
            <div className="space-y-4">
              {isLoadingMarketing ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : marketingData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総ユーザー数</p>
                        <p className="text-2xl font-bold">{marketingData.totalUsers.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">今月の新規登録</p>
                        <p className="text-2xl font-bold text-green-600">{marketingData.newUsersThisMonth.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">フォロー総数</p>
                        <p className="text-2xl font-bold">{marketingData.totalFollows.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">アクティブサブスクリプション</p>
                        <p className="text-2xl font-bold text-pink-600">{marketingData.activeSubscriptions.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">動画総再生数</p>
                        <p className="text-2xl font-bold">{marketingData.totalVideoViews.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">動画総いいね数</p>
                        <p className="text-2xl font-bold">{marketingData.totalVideoLikes.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </div>
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
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総メッセージ数</p>
                        <p className="text-2xl font-bold">{messagesData.totalMessages.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総会話数</p>
                        <p className="text-2xl font-bold">{messagesData.totalConversations.toLocaleString()}</p>
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
                            <div key={msg.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-medium text-sm">{msg.senderName}</span>
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

          {/* Inquiries */}
          {activeTab === "inquiries" && (
            <div className="space-y-4">
              {isLoadingInquiries ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : inquiriesData && inquiriesData.length > 0 ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                    <CardTitle className="text-lg">お問い合わせ一覧</CardTitle>
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
                            <tr key={inquiry.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 text-sm font-medium">{inquiry.name}</td>
                              <td className="p-3 text-sm">{inquiry.email}</td>
                              <td className="p-3 text-sm">{inquiry.subject}</td>
                              <td className="p-3">
                                <Badge variant={inquiry.status === "new" ? "destructive" : inquiry.status === "responded" ? "default" : "secondary"}>
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
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">お問い合わせがありません</div>
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
              ) : notificationsData ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">総通知数</p>
                        <p className="text-2xl font-bold">{notificationsData.totalNotifications.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">未読通知</p>
                        <p className="text-2xl font-bold text-pink-600">{notificationsData.unreadNotifications.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">最近の通知</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {notificationsData.recentNotifications.length > 0 ? (
                        <div className="space-y-3">
                          {notificationsData.recentNotifications.slice(0, 20).map((notif) => (
                            <div key={notif.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{notif.title}</span>
                                  <Badge variant={notif.isRead ? "secondary" : "destructive"} className="text-xs">
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
              ) : (
                <div className="text-center py-12 text-muted-foreground">データの読み込みに失敗しました</div>
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
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">登録日</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                              <div>
                                <p className="font-medium text-sm">{user.displayName || user.username || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">@{user.username || user.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{user.email || "-"}</td>
                          <td className="p-3 text-sm font-medium">{formatPoints(user.points)}</td>
                          <td className="p-3 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedUser(user)}
                              data-testid={`manage-user-${user.id}`}
                            >
                              管理
                            </Button>
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
                          </tr>
                        </thead>
                        <tbody>
                          {allVideos.map((video) => (
                            <tr key={video.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3">
                                <p className="font-medium text-sm truncate max-w-[200px]">{video.title}</p>
                              </td>
                              <td className="p-3 text-sm">{video.creatorName}</td>
                              <td className="p-3 text-sm">{video.viewCount.toLocaleString()}</td>
                              <td className="p-3">
                                <Badge variant={video.isPremium ? "default" : "secondary"}>
                                  {video.isPremium ? "プレミアム" : "無料"}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(video.createdAt)}</td>
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
                          </tr>
                        </thead>
                        <tbody>
                          {allProducts.map((product) => (
                            <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3">
                                <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                              </td>
                              <td className="p-3 text-sm">{product.creatorName}</td>
                              <td className="p-3 text-sm font-medium">{product.price.toLocaleString()}pt</td>
                              <td className="p-3 text-sm">{product.stock !== null ? product.stock : "∞"}</td>
                              <td className="p-3">
                                <Badge variant="secondary">
                                  {product.productType === "digital" ? "デジタル" : "物理"}
                                </Badge>
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
                          </tr>
                        </thead>
                        <tbody>
                          {allLiveStreams.map((stream) => (
                            <tr key={stream.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3">
                                <p className="font-medium text-sm truncate max-w-[200px]">{stream.title}</p>
                              </td>
                              <td className="p-3 text-sm">{stream.creatorName}</td>
                              <td className="p-3">
                                <Badge variant={stream.status === "live" ? "default" : "secondary"} className={stream.status === "live" ? "bg-red-500" : ""}>
                                  {stream.status === "live" ? "配信中" : stream.status === "scheduled" ? "予定" : "終了"}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">{stream.viewerCount.toLocaleString()}</td>
                              <td className="p-3 text-sm text-muted-foreground">{stream.startedAt ? formatDate(stream.startedAt) : "-"}</td>
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
    </div>
  );
}
