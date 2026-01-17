import axios from 'axios';

const MODELSLAB_API_KEY = process.env.MODELSLAB_API_KEY;

export async function generateImage(prompt: string, negativePrompt: string = "", width: string = "512", height: string = "1024") {
  if (!MODELSLAB_API_KEY) {
    throw new Error("MODELSLAB_API_KEY is not set");
  }

  const url = "https://modelslab.com/api/v6/images/text2img";

  const payload = {
    key: MODELSLAB_API_KEY,
    prompt: prompt,
    negative_prompt: negativePrompt,
    width: width,
    height: height,
    samples: "1",
    num_inference_steps: "30",
    safety_checker: "no",
    enhance_prompt: "yes",
    guidance_scale: 7.5,
    base64: "yes" // Returning as base64 for easy injection
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.status === "success") {
      return response.data.output[0];
    } else {
      console.error("ModelsLab API Error:", response.data);
      throw new Error(response.data.message || "Failed to generate image");
    }
  } catch (error) {
    console.error("Error calling ModelsLab API:", error);
    throw error;
  }
}
