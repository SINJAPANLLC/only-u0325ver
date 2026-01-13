import { motion } from "framer-motion";
import { 
  Shield, Clock, CheckCircle, XCircle, ExternalLink, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CreatorApplication } from "@shared/schema";

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: applications, isLoading: isLoadingApplications } = useQuery<CreatorApplication[]>({
    queryKey: ["/api/admin/creator-applications", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(`/api/admin/creator-applications${params}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ id, decision, notes }: { id: string; decision: "approved" | "rejected"; notes?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/creator-applications/${id}/decision`, { decision, notes });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/creator-applications"] });
      setSelectedApplication(null);
      setNotes("");
      toast({ 
        title: variables.decision === "approved" ? "申請を承認しました" : "申請を却下しました" 
      });
    },
    onError: () => {
      toast({ title: "処理に失敗しました", variant: "destructive" });
    },
  });

  const email = user?.email || "";
  const adminEmails = ["info@sinjapan.jp"];
  const isAdmin = adminEmails.includes(email) || email.includes("admin");

  if (isLoading) {
    return (
      <div className="pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pb-20 flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-6">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">アクセス権限がありません</h2>
          <p className="text-muted-foreground mb-4">このページは管理者専用です</p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            ホームに戻る
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600"><Clock className="h-3 w-3 mr-1" />審査中</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />承認済み</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" />却下</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="pb-20 overflow-y-auto scrollbar-hide">
      <div className="h-16" />
      <div className="p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
            <p className="text-sm text-muted-foreground">クリエイター申請の管理</p>
          </div>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["pending", "approved", "rejected", "all"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              data-testid={`button-filter-${status}`}
            >
              {status === "pending" && "審査中"}
              {status === "approved" && "承認済み"}
              {status === "rejected" && "却下"}
              {status === "all" && "すべて"}
            </Button>
          ))}
        </div>

        {isLoadingApplications ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-card border border-card-border p-4 space-y-3"
                onClick={() => setSelectedApplication(application)}
                data-testid={`card-application-${application.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">ID: {application.userId}</span>
                    {getStatusBadge(application.status || "pending")}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(application.submittedAt)}
                  </span>
                </div>

                {application.portfolioUrl && (
                  <a 
                    href={application.portfolioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    ポートフォリオ
                  </a>
                )}

                {application.experience && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">活動経験</p>
                    <p className="text-sm line-clamp-2">{application.experience}</p>
                  </div>
                )}

                {application.reason && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">申請理由</p>
                    <p className="text-sm line-clamp-2">{application.reason}</p>
                  </div>
                )}

                {application.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        decisionMutation.mutate({ id: application.id, decision: "approved" });
                      }}
                      disabled={decisionMutation.isPending}
                      data-testid={`button-approve-${application.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApplication(application);
                      }}
                      disabled={decisionMutation.isPending}
                      data-testid={`button-reject-${application.id}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      却下
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">申請がありません</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedApplication && selectedApplication.status === "pending"} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>申請を却下</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              却下理由をメモとして残すことができます（任意）
            </p>
            <div className="space-y-2">
              <Label htmlFor="notes">却下理由</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例: ポートフォリオの内容が不十分"
                rows={3}
                data-testid="input-rejection-notes"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedApplication(null);
                  setNotes("");
                }}
                data-testid="button-cancel-rejection"
              >
                キャンセル
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (selectedApplication) {
                    decisionMutation.mutate({ 
                      id: selectedApplication.id, 
                      decision: "rejected",
                      notes: notes || undefined 
                    });
                  }
                }}
                disabled={decisionMutation.isPending}
                data-testid="button-confirm-rejection"
              >
                {decisionMutation.isPending ? "処理中..." : "却下する"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
