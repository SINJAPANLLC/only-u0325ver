const WOWZA_API_KEY = process.env.WOWZA_API_KEY || "";
const WOWZA_ACCESS_KEY = process.env.WOWZA_ACCESS_KEY || "";
const WOWZA_BASE_URL = "https://api.cloud.wowza.com/api/v1.10";

function getHeaders() {
  return {
    "wsc-api-key": WOWZA_API_KEY,
    "wsc-access-key": WOWZA_ACCESS_KEY,
    "Content-Type": "application/json",
  };
}

export function isWowzaConfigured(): boolean {
  return !!(WOWZA_API_KEY && WOWZA_ACCESS_KEY);
}

export interface WowzaStreamInfo {
  wowzaStreamId: string;
  rtmpServerUrl: string;
  streamKey: string;
  playbackUrl: string;
}

export async function createWowzaLiveStream(name: string): Promise<WowzaStreamInfo | null> {
  if (!isWowzaConfigured()) return null;

  try {
    const res = await fetch(`${WOWZA_BASE_URL}/live_streams`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        live_stream: {
          name: name.substring(0, 200),
          transcoder_type: "passthrough",
          billing_mode: "pay_as_you_go",
          broadcast_location: "asia_pacific_japan",
          encoder: "other_rtmp",
          delivery_method: "push",
          aspect_ratio_width: 1280,
          aspect_ratio_height: 720,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Wowza create stream failed:", res.status, errText);
      return null;
    }

    const data = await res.json();
    const stream = data.live_stream;
    console.log("Wowza stream created:", stream.id, stream.name);

    // Start the stream so it's ready to accept RTMP input
    await startWowzaLiveStream(stream.id);

    return {
      wowzaStreamId: stream.id,
      rtmpServerUrl: stream.primary_server,
      streamKey: stream.stream_name,
      playbackUrl:
        stream.player_hls_playback_url ||
        stream.playback_url ||
        "",
    };
  } catch (err) {
    console.error("Wowza create stream error:", err);
    return null;
  }
}

export async function startWowzaLiveStream(wowzaStreamId: string): Promise<boolean> {
  if (!isWowzaConfigured() || !wowzaStreamId) return false;
  try {
    const res = await fetch(`${WOWZA_BASE_URL}/live_streams/${wowzaStreamId}/start`, {
      method: "PUT",
      headers: getHeaders(),
    });
    console.log("Wowza start stream:", wowzaStreamId, res.status);
    return res.ok;
  } catch (err) {
    console.error("Wowza start stream error:", err);
    return false;
  }
}

export async function stopWowzaLiveStream(wowzaStreamId: string): Promise<boolean> {
  if (!isWowzaConfigured() || !wowzaStreamId) return false;
  try {
    const res = await fetch(`${WOWZA_BASE_URL}/live_streams/${wowzaStreamId}/stop`, {
      method: "PUT",
      headers: getHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("Wowza stop stream error:", err);
    return false;
  }
}

export async function deleteWowzaLiveStream(wowzaStreamId: string): Promise<boolean> {
  if (!isWowzaConfigured() || !wowzaStreamId) return false;
  try {
    const res = await fetch(`${WOWZA_BASE_URL}/live_streams/${wowzaStreamId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error("Wowza delete stream error:", err);
    return false;
  }
}

export async function getWowzaStreamState(wowzaStreamId: string): Promise<string | null> {
  if (!isWowzaConfigured() || !wowzaStreamId) return null;
  try {
    const res = await fetch(`${WOWZA_BASE_URL}/live_streams/${wowzaStreamId}/state`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.live_stream?.state || null;
  } catch (err) {
    return null;
  }
}
