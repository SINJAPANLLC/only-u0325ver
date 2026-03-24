import { useCallback, useRef, useState } from "react";

interface WHIPConfig {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
}

export function useWHIP({ onConnected, onDisconnected, onError }: WHIPConfig = {}) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const whipResourceUrlRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async (whipUrl: string, stream: MediaStream) => {
    try {
      setIsConnecting(true);

      // Clean up existing connection
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.cloudflare.com:3478" },
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setIsConnected(true);
          setIsConnecting(false);
          onConnected?.();
        } else if (state === "disconnected" || state === "failed" || state === "closed") {
          setIsConnected(false);
          setIsConnecting(false);
          onDisconnected?.();
        }
      };

      // Add all tracks from the stream
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering to complete
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 5000); // Max 5s wait
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timeout);
          resolve();
          return;
        }
        pc.addEventListener("icegatheringstatechange", () => {
          if (pc.iceGatheringState === "complete") {
            clearTimeout(timeout);
            resolve();
          }
        });
        pc.addEventListener("icecandidate", (e) => {
          if (e.candidate === null) {
            clearTimeout(timeout);
            resolve();
          }
        });
      });

      // POST SDP offer to WHIP endpoint
      const response = await fetch(whipUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: pc.localDescription!.sdp,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WHIP failed (${response.status}): ${errorText}`);
      }

      // Store the WHIP resource URL for later (ICE restart, DELETE)
      const location = response.headers.get("Location");
      if (location) {
        whipResourceUrlRef.current = location.startsWith("http") ? location : new URL(location, whipUrl).href;
      }

      // Set remote description (SDP answer)
      const contentType = response.headers.get("Content-Type") || "";
      const answerSdp = await response.text();

      if (answerSdp.trim()) {
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      }

      setIsConnecting(false);
    } catch (err: any) {
      setIsConnecting(false);
      setIsConnected(false);
      console.error("WHIP connection error:", err);
      onError?.(err.message || "Bunny接続に失敗しました");
    }
  }, [onConnected, onDisconnected, onError]);

  const disconnect = useCallback(async () => {
    // Send DELETE to WHIP resource URL to cleanly close the session
    if (whipResourceUrlRef.current) {
      try {
        await fetch(whipResourceUrlRef.current, { method: "DELETE" });
      } catch (e) {
        // Ignore errors on disconnect
      }
      whipResourceUrlRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    onDisconnected?.();
  }, [onDisconnected]);

  // Update stream tracks (e.g., when camera is toggled)
  const updateStream = useCallback((stream: MediaStream) => {
    const pc = pcRef.current;
    if (!pc) return;
    const senders = pc.getSenders();
    stream.getTracks().forEach(track => {
      const sender = senders.find(s => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track).catch(() => {});
      }
    });
  }, []);

  return { connect, disconnect, updateStream, isConnected, isConnecting };
}
