import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Check, Circle, User, Phone, FileText, Clock, Camera, Upload } from "lucide-react";

type ApplicationStep = "personal_info" | "phone_verification" | "document_submission" | "under_review" | "completed";

interface Application {
  id: string;
  userId: string;
  status: string;
  currentStep: ApplicationStep;
  fullName?: string;
  birthDate?: string;
  gender?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  building?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  idDocumentType?: string;
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  selfieUrl?: string;
}

const STEPS = [
  { id: "personal_info", label: "本人情報", icon: User },
  { id: "phone_verification", label: "電話番号認証", icon: Phone },
  { id: "document_submission", label: "書類提出", icon: FileText },
  { id: "under_review", label: "書類審査", icon: Clock },
];

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const DOCUMENT_TYPES = [
  { value: "drivers_license", label: "運転免許証" },
  { value: "my_number_card", label: "マイナンバーカード" },
  { value: "passport", label: "パスポート" },
  { value: "residence_card", label: "在留カード" },
];

export default function CreatorApplication() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form states for each step
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    birthDate: "",
    gender: "",
    postalCode: "",
    prefecture: "",
    city: "",
    address: "",
    building: "",
  });
  
  const [phoneInfo, setPhoneInfo] = useState({
    phoneNumber: "",
    verificationCode: "",
  });
  
  const [documentInfo, setDocumentInfo] = useState({
    idDocumentType: "",
    idDocumentFront: null as File | null,
    idDocumentBack: null as File | null,
    selfie: null as File | null,
  });

  const [codeSent, setCodeSent] = useState(false);

  // Fetch existing application
  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ["/api/creator-application"],
  });

  // Initialize form with existing data
  useEffect(() => {
    if (application) {
      setPersonalInfo({
        fullName: application.fullName || "",
        birthDate: application.birthDate || "",
        gender: application.gender || "",
        postalCode: application.postalCode || "",
        prefecture: application.prefecture || "",
        city: application.city || "",
        address: application.address || "",
        building: application.building || "",
      });
      setPhoneInfo({
        phoneNumber: application.phoneNumber || "",
        verificationCode: "",
      });
      setDocumentInfo({
        idDocumentType: application.idDocumentType || "",
        idDocumentFront: null,
        idDocumentBack: null,
        selfie: null,
      });
    }
  }, [application]);

  // Mutations
  const savePersonalInfoMutation = useMutation({
    mutationFn: async (data: typeof personalInfo) => {
      return apiRequest("/api/creator-application/personal-info", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator-application"] });
      toast({ title: "本人情報を保存しました" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const sendVerificationCodeMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return apiRequest("/api/creator-application/send-verification", {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      });
    },
    onSuccess: () => {
      setCodeSent(true);
      toast({ title: "認証コードを送信しました" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; code: string }) => {
      return apiRequest("/api/creator-application/verify-phone", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator-application"] });
      toast({ title: "電話番号を認証しました" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const submitDocumentsMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/creator-application/documents", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "エラーが発生しました");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator-application"] });
      toast({ title: "書類を提出しました" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const currentStep = application?.currentStep || "personal_info";
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalInfo.fullName || !personalInfo.birthDate || !personalInfo.gender || 
        !personalInfo.postalCode || !personalInfo.prefecture || !personalInfo.city || !personalInfo.address) {
      toast({ title: "必須項目を入力してください", variant: "destructive" });
      return;
    }
    savePersonalInfoMutation.mutate(personalInfo);
  };

  const handleSendCode = () => {
    if (!phoneInfo.phoneNumber) {
      toast({ title: "電話番号を入力してください", variant: "destructive" });
      return;
    }
    sendVerificationCodeMutation.mutate(phoneInfo.phoneNumber);
  };

  const handleVerifyPhone = () => {
    if (!phoneInfo.verificationCode) {
      toast({ title: "認証コードを入力してください", variant: "destructive" });
      return;
    }
    verifyPhoneMutation.mutate({
      phoneNumber: phoneInfo.phoneNumber,
      code: phoneInfo.verificationCode,
    });
  };

  const handleDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentInfo.idDocumentType || !documentInfo.idDocumentFront || !documentInfo.selfie) {
      toast({ title: "必須項目を入力してください", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("idDocumentType", documentInfo.idDocumentType);
    formData.append("idDocumentFront", documentInfo.idDocumentFront);
    if (documentInfo.idDocumentBack) {
      formData.append("idDocumentBack", documentInfo.idDocumentBack);
    }
    formData.append("selfie", documentInfo.selfie);
    
    submitDocumentsMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If application is approved
  if (application?.status === "approved") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center p-4 border-b">
          <Link href="/account">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold ml-2">クリエイター申請</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">承認されました</h2>
          <p className="text-muted-foreground text-center mb-6">
            クリエイターとして活動を開始できます
          </p>
          <Link href="/account">
            <Button data-testid="button-go-to-account">
              マイページへ戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If application is rejected
  if (application?.status === "rejected") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="flex items-center p-4 border-b">
          <Link href="/account">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold ml-2">クリエイター申請</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <Circle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">申請が却下されました</h2>
          <p className="text-muted-foreground text-center mb-6">
            詳細はサポートまでお問い合わせください
          </p>
          <Link href="/account">
            <Button data-testid="button-go-to-account">
              マイページへ戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center p-4 border-b">
        <Link href="/account">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold ml-2">クリエイター申請</h1>
      </header>

      {/* Stepper */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUnderReview = currentStep === "under_review" || currentStep === "completed";
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-1
                  ${isCompleted ? "bg-green-500 text-white" : 
                    isCurrent ? "bg-primary text-primary-foreground" : 
                    "bg-muted text-muted-foreground"}
                `}>
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs text-center ${isCurrent ? "font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`absolute h-0.5 w-full ${isCompleted ? "bg-green-500" : "bg-muted"}`} 
                       style={{ top: "20px", left: "50%" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Personal Info */}
        {currentStep === "personal_info" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">本人情報</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">氏名 <span className="text-red-500">*</span></Label>
                  <Input
                    id="fullName"
                    placeholder="山田 太郎"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    data-testid="input-fullname"
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate">生年月日 <span className="text-red-500">*</span></Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={personalInfo.birthDate}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                    data-testid="input-birthdate"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">性別 <span className="text-red-500">*</span></Label>
                  <Select
                    value={personalInfo.gender}
                    onValueChange={(value) => setPersonalInfo({ ...personalInfo, gender: value })}
                  >
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="postalCode">郵便番号 <span className="text-red-500">*</span></Label>
                  <Input
                    id="postalCode"
                    placeholder="123-4567"
                    value={personalInfo.postalCode}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, postalCode: e.target.value })}
                    data-testid="input-postalcode"
                  />
                </div>

                <div>
                  <Label htmlFor="prefecture">都道府県 <span className="text-red-500">*</span></Label>
                  <Select
                    value={personalInfo.prefecture}
                    onValueChange={(value) => setPersonalInfo({ ...personalInfo, prefecture: value })}
                  >
                    <SelectTrigger data-testid="select-prefecture">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFECTURES.map((pref) => (
                        <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">市区町村 <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    placeholder="渋谷区"
                    value={personalInfo.city}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                    data-testid="input-city"
                  />
                </div>

                <div>
                  <Label htmlFor="address">番地 <span className="text-red-500">*</span></Label>
                  <Input
                    id="address"
                    placeholder="1-2-3"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                    data-testid="input-address"
                  />
                </div>

                <div>
                  <Label htmlFor="building">建物名・部屋番号</Label>
                  <Input
                    id="building"
                    placeholder="○○マンション 101号室"
                    value={personalInfo.building}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, building: e.target.value })}
                    data-testid="input-building"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={savePersonalInfoMutation.isPending}
                  data-testid="button-save-personal-info"
                >
                  {savePersonalInfoMutation.isPending ? "保存中..." : "次へ進む"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Phone Verification */}
        {currentStep === "phone_verification" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">電話番号認証</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                本人確認のため、SMSで認証コードを送信します。
              </p>

              <div>
                <Label htmlFor="phoneNumber">電話番号</Label>
                <div className="flex gap-2">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="09012345678"
                    value={phoneInfo.phoneNumber}
                    onChange={(e) => setPhoneInfo({ ...phoneInfo, phoneNumber: e.target.value })}
                    disabled={codeSent || application?.phoneVerified}
                    data-testid="input-phone"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={sendVerificationCodeMutation.isPending || codeSent || application?.phoneVerified}
                    data-testid="button-send-code"
                  >
                    {sendVerificationCodeMutation.isPending ? "送信中..." : codeSent ? "送信済" : "送信"}
                  </Button>
                </div>
              </div>

              {codeSent && !application?.phoneVerified && (
                <div>
                  <Label htmlFor="verificationCode">認証コード</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verificationCode"
                      placeholder="123456"
                      value={phoneInfo.verificationCode}
                      onChange={(e) => setPhoneInfo({ ...phoneInfo, verificationCode: e.target.value })}
                      data-testid="input-verification-code"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyPhone}
                      disabled={verifyPhoneMutation.isPending}
                      data-testid="button-verify-code"
                    >
                      {verifyPhoneMutation.isPending ? "確認中..." : "確認"}
                    </Button>
                  </div>
                </div>
              )}

              {application?.phoneVerified && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span>電話番号認証済み</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Document Submission */}
        {currentStep === "document_submission" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">本人確認書類の提出</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDocumentSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  本人確認のため、身分証明書の写真をアップロードしてください。
                </p>

                <div>
                  <Label>本人確認書類の種類 <span className="text-red-500">*</span></Label>
                  <Select
                    value={documentInfo.idDocumentType}
                    onValueChange={(value) => setDocumentInfo({ ...documentInfo, idDocumentType: value })}
                  >
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((doc) => (
                        <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>書類の表面 <span className="text-red-500">*</span></Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {documentInfo.idDocumentFront ? (
                          <>
                            <Check className="h-8 w-8 text-green-500 mb-2" />
                            <span className="text-sm">{documentInfo.idDocumentFront.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">クリックしてアップロード</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setDocumentInfo({ ...documentInfo, idDocumentFront: e.target.files?.[0] || null })}
                        data-testid="input-document-front"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label>書類の裏面（任意）</Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {documentInfo.idDocumentBack ? (
                          <>
                            <Check className="h-8 w-8 text-green-500 mb-2" />
                            <span className="text-sm">{documentInfo.idDocumentBack.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">クリックしてアップロード</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setDocumentInfo({ ...documentInfo, idDocumentBack: e.target.files?.[0] || null })}
                        data-testid="input-document-back"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <Label>顔写真（セルフィー） <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    本人確認書類と一緒に顔が写るように撮影してください
                  </p>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {documentInfo.selfie ? (
                          <>
                            <Check className="h-8 w-8 text-green-500 mb-2" />
                            <span className="text-sm">{documentInfo.selfie.name}</span>
                          </>
                        ) : (
                          <>
                            <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">クリックしてアップロード</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setDocumentInfo({ ...documentInfo, selfie: e.target.files?.[0] || null })}
                        data-testid="input-selfie"
                      />
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitDocumentsMutation.isPending}
                  data-testid="button-submit-documents"
                >
                  {submitDocumentsMutation.isPending ? "送信中..." : "書類を提出する"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Under Review */}
        {currentStep === "under_review" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">書類審査中</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">審査中です</h3>
              <p className="text-muted-foreground mb-4">
                提出された書類を確認しています。<br />
                審査には通常1〜3営業日かかります。
              </p>
              <p className="text-sm text-muted-foreground">
                審査が完了次第、メールでお知らせします。
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
