import { db } from "../db";
import { columnArticles } from "@shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "dummy",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

// SEOに強い日本語トピックリスト（クリエイターエコノミー・エンタメ系）
const TOPIC_POOL = [
  { keyword: "クリエイター 収益化 方法", category: "creator", audience: "コンテンツクリエイター" },
  { keyword: "ファンクラブ 始め方 2025", category: "creator", audience: "クリエイター志望者" },
  { keyword: "ライブ配信 稼ぐ コツ", category: "creator", audience: "ライバー・ストリーマー" },
  { keyword: "デジタルコンテンツ 販売 プラットフォーム", category: "creator", audience: "デジタルクリエイター" },
  { keyword: "サブスクリプション サービス 始め方", category: "creator", audience: "起業家・クリエイター" },
  { keyword: "動画配信 収益 仕組み", category: "creator", audience: "動画クリエイター" },
  { keyword: "フォロワー 増やす 方法 SNS", category: "tips", audience: "SNSユーザー" },
  { keyword: "インフルエンサー 収入 種類", category: "creator", audience: "インフルエンサー志望者" },
  { keyword: "ポイント経済 アプリ おすすめ", category: "fan", audience: "アプリユーザー" },
  { keyword: "Only-U クリエイター 登録方法", category: "creator", audience: "クリエイター志望者" },
  { keyword: "ライブ配信 視聴者 増やす テクニック", category: "tips", audience: "配信者" },
  { keyword: "デジタル写真 販売 方法", category: "creator", audience: "カメラマン・フォトグラファー" },
  { keyword: "ファン 応援 課金 心理", category: "fan", audience: "ファン・サポーター" },
  { keyword: "クリエイターエコノミー 日本 現状 2025", category: "news", audience: "ビジネスパーソン" },
  { keyword: "動画編集 初心者 スマホ アプリ", category: "tips", audience: "動画初心者" },
  { keyword: "副業 クリエイター 在宅 収入", category: "tips", audience: "副業希望者" },
  { keyword: "月額課金 コンテンツ ビジネスモデル", category: "creator", audience: "起業家" },
  { keyword: "プレミアム会員 特典 設計方法", category: "creator", audience: "クリエイター" },
  { keyword: "オンラインサロン 運営 コツ", category: "creator", audience: "コミュニティオーナー" },
  { keyword: "配信プラットフォーム 比較 2025", category: "tips", audience: "クリエイター" },
  { keyword: "メンバーシップ 収益 モデル 設計", category: "creator", audience: "コンテンツ起業家" },
  { keyword: "ショート動画 バズる 方法", category: "tips", audience: "動画クリエイター" },
  { keyword: "クリエイター 税金 確定申告 副業", category: "tips", audience: "フリーランスクリエイター" },
  { keyword: "ライブコマース 売上 伸ばす", category: "creator", audience: "EC事業者" },
  { keyword: "デジタルグッズ ファン向け 販売戦略", category: "creator", audience: "クリエイター" },
  { keyword: "ブランディング クリエイター 個人", category: "tips", audience: "個人クリエイター" },
  { keyword: "限定コンテンツ 価値 作り方", category: "creator", audience: "クリエイター" },
  { keyword: "投げ銭 文化 日本 仕組み", category: "fan", audience: "ライブ視聴者" },
  { keyword: "サポーター コミュニティ 育て方", category: "creator", audience: "クリエイター" },
  { keyword: "コンテンツ マーケティング 日本語 SEO", category: "tips", audience: "マーケター" },
  { keyword: "ライブ配信 機材 おすすめ 初心者", category: "tips", audience: "配信初心者" },
  { keyword: "ファン向けアプリ 選び方 ポイント", category: "fan", audience: "ファン" },
  { keyword: "クリエイター マネタイズ 10の方法", category: "creator", audience: "クリエイター志望" },
  { keyword: "エンタメ系副業 始め方 2025", category: "tips", audience: "副業希望者" },
  { keyword: "配信 スーパーチャット チップ 仕組み", category: "fan", audience: "ライブファン" },
  { keyword: "クリエイター 成功事例 日本 インタビュー", category: "news", audience: "クリエイター志望" },
  { keyword: "デジタルコンテンツ 著作権 クリエイター 注意点", category: "tips", audience: "クリエイター" },
  { keyword: "SNS フォロワー エンゲージメント 上げ方", category: "tips", audience: "SNS運用者" },
  { keyword: "オリジナルグッズ 販売 個人 方法", category: "creator", audience: "クリエイター" },
  { keyword: "ファンとの関係 深め方 クリエイター", category: "creator", audience: "クリエイター" },
  { keyword: "パーソナルブランド 作り方 クリエイター", category: "creator", audience: "個人クリエイター" },
  { keyword: "ライブ配信 トーク スキル 向上", category: "tips", audience: "配信者" },
  { keyword: "有料記事 売れる 書き方 コツ", category: "tips", audience: "ライター・クリエイター" },
  { keyword: "コンテンツ 無料 有料 線引き 戦略", category: "creator", audience: "クリエイター" },
  { keyword: "クリエイター プロフィール 魅力的に 作り方", category: "tips", audience: "クリエイター初心者" },
  { keyword: "ライブ配信 スケジュール 管理 コツ", category: "tips", audience: "配信者" },
  { keyword: "Only-U ファン 楽しみ方 ガイド", category: "fan", audience: "ファン" },
  { keyword: "クリエイター 出金 スムーズに 方法", category: "creator", audience: "クリエイター" },
  { keyword: "メッセージ機能 DM ファン 対応 マナー", category: "tips", audience: "クリエイター" },
  { keyword: "動画 サムネイル クリック率 上げる デザイン", category: "tips", audience: "動画クリエイター" },
  { keyword: "クリエイター 継続 モチベーション 維持", category: "tips", audience: "クリエイター" },
  { keyword: "配信 音質 改善 簡単 方法", category: "tips", audience: "配信者" },
  { keyword: "Only-U 安全 プライバシー 保護 機能", category: "general", audience: "全ユーザー" },
  { keyword: "ポイント チャージ 方法 おすすめ", category: "fan", audience: "ファン" },
  { keyword: "クリエイター 月収 いくら 目安", category: "creator", audience: "クリエイター志望" },
  { keyword: "配信 炎上 対策 防ぎ方", category: "tips", audience: "配信者" },
  { keyword: "ライブ 視聴者 コメント 活性化", category: "tips", audience: "配信者" },
  { keyword: "クリエイター活動 法的 知識 基礎", category: "tips", audience: "クリエイター" },
  { keyword: "ファン心理 購買行動 クリエイター経済", category: "general", audience: "クリエイター" },
  { keyword: "デジタルコンテンツ 需要 トレンド 2025", category: "news", audience: "ビジネスパーソン" },
];

function generateSlug(title: string, index: number): string {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const base = title
    .toLowerCase()
    .replace(/[ぁ-ん]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 40)
    .replace(/^-|-$/g, "");
  return `${dateStr}-${index + 1}-${base || "column"}`;
}

export async function generateDailyColumns(): Promise<void> {
  console.log("[ColumnGenerator] Starting daily column generation (10 articles)...");

  // Pick 10 random topics
  const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5);
  const todayTopics = shuffled.slice(0, 10);

  let generated = 0;
  const openai = getOpenAI();

  for (let i = 0; i < todayTopics.length; i++) {
    const topic = todayTopics[i];
    try {
      const prompt = `キーワード: ${topic.keyword}
ターゲット読者: ${topic.audience}
文字数: 1200〜1800字
トーン: プロフェッショナルかつ親しみやすい、読みやすいブログ記事スタイル

SEOに強く、読者が最後まで読みたくなるような日本語コラム記事を書いてください。
H2/H3タグを使って構造化し、具体的な数字や事例を含めてください。

JSON形式で返してください:
{
  "title": "SEOタイトル（30-60字、キーワード含む）",
  "excerpt": "120字以内の魅力的な記事概要",
  "content": "<h2>見出し</h2><p>本文...</p>（HTML形式、最低1000字）",
  "metaDescription": "155字以内のメタディスクリプション",
  "metaKeywords": "キーワード1,キーワード2,キーワード3,キーワード4,キーワード5",
  "slug": "url-slug-in-english-or-romaji"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "あなたは日本語のSEOライターです。クリエイターエコノミーに関する高品質なコラム記事を作成します。",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const data = JSON.parse(completion.choices[0].message.content || "{}");
      if (!data.title || !data.content) {
        console.warn(`[ColumnGenerator] Article ${i + 1}: Missing required fields, skipping`);
        continue;
      }

      const slug = generateSlug(data.slug || data.title, i);

      // Check if slug already exists
      const [existing] = await db.select().from(columnArticles).where(eq(columnArticles.slug, slug));
      if (existing) {
        console.log(`[ColumnGenerator] Article ${i + 1}: Slug already exists, skipping`);
        continue;
      }

      await db.insert(columnArticles).values({
        title: data.title,
        slug,
        excerpt: data.excerpt || "",
        content: data.content,
        metaDescription: data.metaDescription || "",
        metaKeywords: data.metaKeywords || topic.keyword,
        category: topic.category,
        published: true,
        publishedAt: new Date(),
      });

      generated++;
      console.log(`[ColumnGenerator] Article ${i + 1}/${todayTopics.length} done: "${data.title}"`);

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[ColumnGenerator] Article ${i + 1} error:`, err);
    }
  }

  console.log(`[ColumnGenerator] Done! Generated ${generated}/10 articles.`);
}

export function startDailyColumnScheduler(): void {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Run once at startup (after 2 minute delay to not block startup)
  setTimeout(async () => {
    try {
      await generateDailyColumns();
    } catch (err) {
      console.error("[ColumnGenerator] Startup run error:", err);
    }
  }, 2 * 60 * 1000);

  // Then run every 24 hours
  setInterval(async () => {
    try {
      await generateDailyColumns();
    } catch (err) {
      console.error("[ColumnGenerator] Scheduled run error:", err);
    }
  }, TWENTY_FOUR_HOURS);

  console.log("[ColumnGenerator] Daily scheduler started (first run in 2 minutes).");
}
