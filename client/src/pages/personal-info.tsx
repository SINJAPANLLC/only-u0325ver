import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  User,
  Calendar,
  MapPin,
  Phone,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CreatorApplication } from "@shared/schema";

export default function PersonalInfoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: application, isLoading } = useQuery<CreatorApplication | null>({
    queryKey: ["/api/creator-applications/me"],
  });

  const [form, setForm] = useState({
    fullName: "",
    birthDate: "",
    gender: "",
    postalCode: "",
    prefecture: "",
    city: "",
    address: "",
    building: "",
  });

  useEffect(() => {
    if (application) {
      setForm({
        fullName: application.fullName || "",
        birthDate: application.birthDate || "",
        gender: application.gender || "",
        postalCode: application.postalCode || "",
        prefecture: application.prefecture || "",
        city: application.city || "",
        address: application.address || "",
        building: application.building || "",
      });
    }
  }, [application]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      await apiRequest("PATCH", "/api/creator-applications/personal-info", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator-applications/me"] });
      toast({ title: "本人情報を更新しました" });
    },
    onError: () => {
      toast({ title: "更新に失敗しました", variant: "destructive" });
    },
  });

  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center h-14 px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => setLocation("/account")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-base">本人情報</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-card border border-border/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">基本情報</p>
              <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs text-muted-foreground">氏名（本名）</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="山田 太郎"
                    className="rounded-xl"
                    data-testid="input-fullname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-xs text-muted-foreground">生年月日</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                    className="rounded-xl"
                    data-testid="input-birthdate"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-xs text-muted-foreground">性別</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(value) => setForm({ ...form, gender: value })}
                  >
                    <SelectTrigger className="rounded-xl" data-testid="select-gender">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2 px-1">住所</p>
              <div className="rounded-2xl bg-card border border-border/30 p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-xs text-muted-foreground">郵便番号</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    placeholder="123-4567"
                    className="rounded-xl"
                    data-testid="input-postalcode"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefecture" className="text-xs text-muted-foreground">都道府県</Label>
                  <Select
                    value={form.prefecture}
                    onValueChange={(value) => setForm({ ...form, prefecture: value })}
                  >
                    <SelectTrigger className="rounded-xl" data-testid="select-prefecture">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {prefectures.map((pref) => (
                        <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs text-muted-foreground">市区町村</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="渋谷区"
                    className="rounded-xl"
                    data-testid="input-city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs text-muted-foreground">番地</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="1-2-3"
                    className="rounded-xl"
                    data-testid="input-address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="building" className="text-xs text-muted-foreground">建物名・部屋番号</Label>
                  <Input
                    id="building"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value })}
                    placeholder="○○マンション 101号室"
                    className="rounded-xl"
                    data-testid="input-building"
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold"
              onClick={() => updateMutation.mutate(form)}
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "保存中..." : "保存する"}
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
