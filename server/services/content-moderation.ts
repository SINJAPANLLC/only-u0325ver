import OpenAI from "openai";
import { db } from "../db";
import { adminNotifications } from "@shared/schema";

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

export interface ModerationResult {
  flagged: boolean;
  reason?: string;
  severity: "low" | "medium" | "high";
  categories: string[];
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  try {
    const openai = getOpenAI();
    if (!openai) return { flagged: false, severity: "low", categories: [] };
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `あなたはコンテンツ審査の専門家です。画像を分析し、以下の違反がないか確認してください：

1. 無修正コンテンツ（日本の法律で違法）
2. 児童ポルノ・児童虐待
3. 暴力的・残虐なコンテンツ
4. 違法薬物
5. 個人情報の露出

分析結果をJSON形式で返してください：
{
  "flagged": true/false,
  "reason": "違反理由（違反がない場合は空文字）",
  "severity": "low/medium/high",
  "categories": ["検出されたカテゴリーの配列"]
}

注意：
- 成人向けコンテンツ自体は許可されていますが、無修正は禁止です
- 疑わしい場合は flagged: true としてください
- 厳格に判断してください`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            },
            {
              type: "text",
              text: "この画像を審査してください。"
            }
          ]
        }
      ],
      max_completion_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { flagged: false, severity: "low", categories: [] };
    }

    const result = JSON.parse(content) as ModerationResult;
    return result;
  } catch (error) {
    console.error("Content moderation error:", error);
    return { flagged: false, severity: "low", categories: [] };
  }
}

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    const openai = getOpenAI();
    if (!openai) return { flagged: false, severity: "low", categories: [] };
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはコンテンツ審査の専門家です。テキストを分析し、以下の違反がないか確認してください：

1. 違法な内容の示唆
2. 児童に関する不適切な内容
3. 個人情報の露出
4. 詐欺・スパムの可能性

分析結果をJSON形式で返してください：
{
  "flagged": true/false,
  "reason": "違反理由（違反がない場合は空文字）",
  "severity": "low/medium/high",
  "categories": ["検出されたカテゴリーの配列"]
}`
        },
        {
          role: "user",
          content: `このテキストを審査してください：\n\n${text}`
        }
      ],
      max_completion_tokens: 300,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { flagged: false, severity: "low", categories: [] };
    }

    const result = JSON.parse(content) as ModerationResult;
    return result;
  } catch (error) {
    console.error("Text moderation error:", error);
    return { flagged: false, severity: "low", categories: [] };
  }
}

export async function createModerationNotification(
  contentType: "video" | "live" | "product" | "message",
  contentId: string,
  contentTitle: string,
  creatorId: string,
  creatorName: string,
  moderationResult: ModerationResult
): Promise<void> {
  try {
    const severityLabels = {
      low: "低",
      medium: "中",
      high: "高"
    };

    await db.insert(adminNotifications).values({
      type: "content_moderation",
      title: `【${severityLabels[moderationResult.severity]}】コンテンツ審査警告`,
      message: `${contentType === "video" ? "動画" : contentType === "live" ? "ライブ配信" : contentType === "product" ? "商品" : "メッセージ"}「${contentTitle}」に違反の可能性があります。

クリエイター: ${creatorName}
理由: ${moderationResult.reason || "不明"}
カテゴリー: ${moderationResult.categories.join(", ") || "なし"}

確認が必要です。`,
      contentType,
      contentId,
      creatorId,
      severity: moderationResult.severity,
      isRead: false,
    });
  } catch (error) {
    console.error("Failed to create moderation notification:", error);
  }
}
