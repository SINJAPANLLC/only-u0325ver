import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "ja" | "en" | "zh" | "ko";

interface Translations {
  [key: string]: {
    ja: string;
    en: string;
    zh: string;
    ko: string;
  };
}

const translations: Translations = {
  "nav.home": { ja: "ホーム", en: "Home", zh: "首页", ko: "홈" },
  "nav.live": { ja: "ライブ", en: "Live", zh: "直播", ko: "라이브" },
  "nav.shop": { ja: "ショップ", en: "Shop", zh: "商店", ko: "샵" },
  "nav.messages": { ja: "メッセージ", en: "Messages", zh: "消息", ko: "메시지" },
  "nav.account": { ja: "アカウント", en: "Account", zh: "账户", ko: "계정" },
  
  "common.follow": { ja: "フォロー", en: "Follow", zh: "关注", ko: "팔로우" },
  "common.following": { ja: "フォロー中", en: "Following", zh: "已关注", ko: "팔로잉" },
  "common.unfollow": { ja: "解除", en: "Unfollow", zh: "取消关注", ko: "언팔로우" },
  "common.subscribe": { ja: "登録する", en: "Subscribe", zh: "订阅", ko: "구독" },
  "common.subscribed": { ja: "登録済み", en: "Subscribed", zh: "已订阅", ko: "구독중" },
  "common.message": { ja: "メッセージ", en: "Message", zh: "发消息", ko: "메시지" },
  "common.purchase": { ja: "購入する", en: "Purchase", zh: "购买", ko: "구매" },
  "common.points": { ja: "ポイント", en: "Points", zh: "积分", ko: "포인트" },
  "common.cancel": { ja: "キャンセル", en: "Cancel", zh: "取消", ko: "취소" },
  "common.confirm": { ja: "確認", en: "Confirm", zh: "确认", ko: "확인" },
  "common.back": { ja: "戻る", en: "Back", zh: "返回", ko: "뒤로" },
  "common.search": { ja: "検索", en: "Search", zh: "搜索", ko: "검색" },
  "common.settings": { ja: "設定", en: "Settings", zh: "设置", ko: "설정" },
  "common.logout": { ja: "ログアウト", en: "Logout", zh: "退出", ko: "로그아웃" },
  "common.login": { ja: "ログイン", en: "Login", zh: "登录", ko: "로그인" },
  "common.register": { ja: "新規登録", en: "Register", zh: "注册", ko: "회원가입" },
  "common.loading": { ja: "読み込み中...", en: "Loading...", zh: "加载中...", ko: "로딩중..." },
  "common.error": { ja: "エラー", en: "Error", zh: "错误", ko: "오류" },
  "common.success": { ja: "成功", en: "Success", zh: "成功", ko: "성공" },
  
  "feed.recommend": { ja: "おすすめ", en: "For You", zh: "推荐", ko: "추천" },
  "feed.following": { ja: "フォロー中", en: "Following", zh: "关注", ko: "팔로잉" },
  
  "shop.all": { ja: "すべて", en: "All", zh: "全部", ko: "전체" },
  "shop.digital": { ja: "デジタル", en: "Digital", zh: "数字", ko: "디지털" },
  "shop.physical": { ja: "物販", en: "Physical", zh: "实物", ko: "상품" },
  "shop.soldout": { ja: "売り切れ", en: "Sold Out", zh: "售罄", ko: "품절" },
  "shop.limited": { ja: "期間限定", en: "Limited", zh: "限时", ko: "한정" },
  "shop.premium": { ja: "メンバー限定", en: "Members Only", zh: "会员专享", ko: "멤버전용" },
  
  "auth.email": { ja: "メールアドレス", en: "Email", zh: "邮箱", ko: "이메일" },
  "auth.password": { ja: "パスワード", en: "Password", zh: "密码", ko: "비밀번호" },
  "auth.confirmPassword": { ja: "パスワード確認", en: "Confirm Password", zh: "确认密码", ko: "비밀번호 확인" },
  "auth.forgotPassword": { ja: "パスワードを忘れた", en: "Forgot Password", zh: "忘记密码", ko: "비밀번호 찾기" },
  
  "notification.title": { ja: "通知", en: "Notifications", zh: "通知", ko: "알림" },
  "notification.empty": { ja: "通知はありません", en: "No notifications", zh: "暂无通知", ko: "알림이 없습니다" },
  "notification.markAllRead": { ja: "すべて既読", en: "Mark all read", zh: "全部已读", ko: "모두 읽음" },
  
  "profile.followers": { ja: "フォロワー", en: "Followers", zh: "粉丝", ko: "팔로워" },
  "profile.posts": { ja: "投稿", en: "Posts", zh: "帖子", ko: "게시물" },
  "profile.likes": { ja: "いいね", en: "Likes", zh: "点赞", ko: "좋아요" },
  
  "points.purchase": { ja: "ポイント購入", en: "Buy Points", zh: "充值积分", ko: "포인트 구매" },
  "points.balance": { ja: "保有ポイント", en: "Balance", zh: "余额", ko: "보유 포인트" },
  "points.insufficient": { ja: "ポイントが不足しています", en: "Insufficient points", zh: "积分不足", ko: "포인트가 부족합니다" },
  
  "creator.apply": { ja: "クリエイター申請", en: "Apply as Creator", zh: "申请成为创作者", ko: "크리에이터 신청" },
  "creator.dashboard": { ja: "クリエイターダッシュボード", en: "Creator Dashboard", zh: "创作者后台", ko: "크리에이터 대시보드" },
  
  "live.viewers": { ja: "視聴者", en: "viewers", zh: "观众", ko: "시청자" },
  "live.watching": { ja: "視聴中", en: "watching", zh: "观看中", ko: "시청중" },
  "live.ended": { ja: "配信終了", en: "Ended", zh: "已结束", ko: "종료됨" },
  
  "age.title": { ja: "年齢確認", en: "Age Verification", zh: "年龄验证", ko: "연령 확인" },
  "age.message": { ja: "このサイトは成人向けコンテンツを含みます。18歳以上ですか？", en: "This site contains adult content. Are you 18 or older?", zh: "本站包含成人内容。您是否已满18岁？", ko: "이 사이트는 성인용 콘텐츠를 포함합니다. 18세 이상입니까?" },
  "age.confirm": { ja: "18歳以上です", en: "I am 18 or older", zh: "我已满18岁", ko: "18세 이상입니다" },
  "age.deny": { ja: "18歳未満です", en: "I am under 18", zh: "我未满18岁", ko: "18세 미만입니다" },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("only-u-language");
      if (saved && ["ja", "en", "zh", "ko"].includes(saved)) {
        return saved as Language;
      }
    } catch {}
    return "ja";
  });

  useEffect(() => {
    try {
      localStorage.setItem("only-u-language", language);
    } catch {}
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.ja || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
