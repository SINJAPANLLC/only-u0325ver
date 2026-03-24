const BUNNY_API_KEY = process.env.BUNNY_API_KEY || "";
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || "";
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME || "";

const BUNNY_STREAM_BASE = "https://video.bunnycdn.com/library";

export function getBunnyVideoUrl(bunnyVideoId: string): string {
  if (!BUNNY_CDN_HOSTNAME || !bunnyVideoId) return "";
  return `https://${BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/playlist.m3u8`;
}

export function getBunnyThumbnailUrl(bunnyVideoId: string): string {
  if (!BUNNY_CDN_HOSTNAME || !bunnyVideoId) return "";
  return `https://${BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/thumbnail.jpg`;
}

export function getBunnyLiveUrl(bunnyPlaybackUrl: string): string {
  return bunnyPlaybackUrl || "";
}

export function getBunnyLivePlaybackUrl(bunnyStreamId: string): string {
  if (!BUNNY_CDN_HOSTNAME || !bunnyStreamId) return "";
  return `https://${BUNNY_CDN_HOSTNAME}/${bunnyStreamId}/playlist.m3u8`;
}

export function getBunnyWhipUrl(streamKey: string): string {
  if (!BUNNY_LIBRARY_ID || !streamKey) return "";
  return `https://video.bunnycdn.com/live/${BUNNY_LIBRARY_ID}/${streamKey}/whip`;
}

export function isBunnyConfigured(): boolean {
  return !!(BUNNY_API_KEY && BUNNY_LIBRARY_ID && BUNNY_CDN_HOSTNAME);
}

export async function createBunnyLiveStream(name: string): Promise<{
  bunnyStreamId: string;
  streamKey: string;
  playbackUrl: string;
  whipUrl: string;
} | null> {
  if (!isBunnyConfigured()) return null;

  try {
    const res = await fetch(`${BUNNY_STREAM_BASE}/${BUNNY_LIBRARY_ID}/streams`, {
      method: "POST",
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      console.error("Bunny create live stream failed:", await res.text());
      return null;
    }

    const data = await res.json();
    const bunnyStreamId: string = data.guid || data.id || data.streamId;
    const streamKey: string = data.streamKey;

    if (!bunnyStreamId || !streamKey) {
      console.error("Bunny live stream missing id/streamKey:", data);
      return null;
    }

    const playbackUrl = getBunnyLivePlaybackUrl(bunnyStreamId);
    const whipUrl = getBunnyWhipUrl(streamKey);

    return { bunnyStreamId, streamKey, playbackUrl, whipUrl };
  } catch (err) {
    console.error("Bunny create live stream error:", err);
    return null;
  }
}

export async function deleteBunnyLiveStream(bunnyStreamId: string): Promise<boolean> {
  if (!isBunnyConfigured() || !bunnyStreamId) return false;

  try {
    const res = await fetch(`${BUNNY_STREAM_BASE}/${BUNNY_LIBRARY_ID}/streams/${bunnyStreamId}`, {
      method: "DELETE",
      headers: { AccessKey: BUNNY_API_KEY },
    });
    return res.ok;
  } catch (err) {
    console.error("Bunny delete live stream error:", err);
    return false;
  }
}

export async function createBunnyVideo(title: string): Promise<{ videoId: string; uploadUrl: string; authorizationSignature: string; expirationTime: number } | null> {
  if (!isBunnyConfigured()) return null;

  try {
    const createRes = await fetch(`${BUNNY_STREAM_BASE}/${BUNNY_LIBRARY_ID}/videos`, {
      method: "POST",
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      console.error("Bunny create video failed:", await createRes.text());
      return null;
    }

    const videoData = await createRes.json();
    const videoId = videoData.guid;

    const expirationTime = Math.floor(Date.now() / 1000) + 3600;
    const authorizationSignature = await generateUploadSignature(BUNNY_LIBRARY_ID, BUNNY_API_KEY, expirationTime, videoId);

    return {
      videoId,
      uploadUrl: `https://video.bunnycdn.com/tusupload`,
      authorizationSignature,
      expirationTime,
    };
  } catch (err) {
    console.error("Bunny create video error:", err);
    return null;
  }
}

export async function getBunnyVideoStatus(bunnyVideoId: string): Promise<{ status: number; encodeProgress: number } | null> {
  if (!isBunnyConfigured() || !bunnyVideoId) return null;

  try {
    const res = await fetch(`${BUNNY_STREAM_BASE}/${BUNNY_LIBRARY_ID}/videos/${bunnyVideoId}`, {
      headers: { AccessKey: BUNNY_API_KEY },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return { status: data.status, encodeProgress: data.encodeProgress };
  } catch (err) {
    console.error("Bunny get video status error:", err);
    return null;
  }
}

export async function deleteBunnyVideo(bunnyVideoId: string): Promise<boolean> {
  if (!isBunnyConfigured() || !bunnyVideoId) return false;

  try {
    const res = await fetch(`${BUNNY_STREAM_BASE}/${BUNNY_LIBRARY_ID}/videos/${bunnyVideoId}`, {
      method: "DELETE",
      headers: { AccessKey: BUNNY_API_KEY },
    });
    return res.ok;
  } catch (err) {
    console.error("Bunny delete video error:", err);
    return false;
  }
}

async function generateUploadSignature(libraryId: string, apiKey: string, expirationTime: number, videoId: string): Promise<string> {
  const data = libraryId + apiKey + expirationTime + videoId;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
