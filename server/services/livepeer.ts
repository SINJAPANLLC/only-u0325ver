const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY || "";
const LIVEPEER_BASE_URL = "https://livepeer.studio/api";

function getHeaders() {
  return {
    Authorization: `Bearer ${LIVEPEER_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export function isLivepeerConfigured(): boolean {
  return !!LIVEPEER_API_KEY;
}

export interface LivepeerStreamInfo {
  livepeerStreamId: string;
  rtmpServerUrl: string;
  streamKey: string;
  playbackUrl: string;
}

export async function createLivepeerStream(name: string): Promise<LivepeerStreamInfo | null> {
  if (!isLivepeerConfigured()) return null;

  try {
    const res = await fetch(`${LIVEPEER_BASE_URL}/stream`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: name.substring(0, 200),
        profiles: [
          {
            name: "720p",
            bitrate: 2_000_000,
            fps: 30,
            width: 1280,
            height: 720,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Livepeer create stream failed:", res.status, errText);
      return null;
    }

    const stream = await res.json();
    console.log("Livepeer stream created:", stream.id);

    return {
      livepeerStreamId: stream.id,
      rtmpServerUrl: "rtmp://rtmp.livepeer.com/live",
      streamKey: stream.streamKey,
      playbackUrl: `https://livepeercdn.studio/hls/${stream.playbackId}/index.m3u8`,
    };
  } catch (err) {
    console.error("Livepeer create stream error:", err);
    return null;
  }
}

export async function deleteLivepeerStream(livepeerStreamId: string): Promise<boolean> {
  if (!isLivepeerConfigured() || !livepeerStreamId) return false;
  try {
    const res = await fetch(`${LIVEPEER_BASE_URL}/stream/${livepeerStreamId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.ok || res.status === 404;
  } catch (err) {
    console.error("Livepeer delete stream error:", err);
    return false;
  }
}

export async function getLivepeerStreamStatus(livepeerStreamId: string): Promise<{ isActive: boolean } | null> {
  if (!isLivepeerConfigured() || !livepeerStreamId) return null;
  try {
    const res = await fetch(`${LIVEPEER_BASE_URL}/stream/${livepeerStreamId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { isActive: data.isActive ?? false };
  } catch (err) {
    return null;
  }
}
