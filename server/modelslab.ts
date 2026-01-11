// ModelsLab API integration for image generation
// This runs server-side to keep API key secure

interface ModelsLabRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  samples?: number;
  seed?: number | null;
}

interface ModelsLabResponse {
  status: string;
  generationTime?: number;
  id?: number;
  output?: string[];
  proxy_links?: string[];
  meta?: Record<string, unknown>;
  nsfw_content_detected?: boolean;
  message?: string;
}

export async function generateImage(request: ModelsLabRequest): Promise<string[]> {
  const apiKey = process.env.MODELSLAB_API_KEY;
  
  if (!apiKey) {
    throw new Error("MODELSLAB_API_KEY is not configured");
  }

  const body = {
    key: apiKey,
    prompt: request.prompt,
    negative_prompt: request.negative_prompt || "bad quality, blurry, distorted, explicit nudity, pornographic",
    width: request.width || 512,
    height: request.height || 768,
    samples: request.samples || 1,
    safety_checker: true, // Keep safety checker enabled for compliance
    seed: request.seed || null,
    base64: false,
    webhook: null,
    track_id: null,
  };

  const response = await fetch("https://modelslab.com/api/v6/realtime/text2img", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data: ModelsLabResponse = await response.json();

  if (data.status === "success" && data.output && data.output.length > 0) {
    return data.output;
  }

  if (data.status === "processing") {
    // For processing status, proxy_links might be available
    if (data.proxy_links && data.proxy_links.length > 0) {
      return data.proxy_links;
    }
    throw new Error("Image is still processing. Please try again later.");
  }

  throw new Error(data.message || "Failed to generate image");
}

// Pre-defined prompts for demo content (safe, stylized descriptions)
export const demoPrompts = {
  glamour: "beautiful japanese woman, elegant portrait, soft lighting, fashion photography, professional studio shot, high quality",
  lingerie: "beautiful asian model, elegant pose, soft pink lighting, artistic photography, professional, fashion editorial",
  bedroom: "beautiful woman relaxing, cozy bedroom setting, warm lighting, lifestyle photography, soft aesthetic",
  bath: "beautiful woman, spa setting, soft steam, relaxation, wellness photography, artistic",
  cosplay: "beautiful cosplayer, anime style costume, colorful, professional photography, creative lighting",
  dance: "beautiful dancer, elegant pose, dramatic lighting, artistic photography, motion blur",
  gravure: "beautiful japanese gravure model, beach setting, summer vibes, professional photography",
};
