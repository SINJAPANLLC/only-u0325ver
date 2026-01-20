import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: number;
  text: string;
  username: string;
  senderId: string;
}

interface WebRTCConfig {
  streamId: string;
  isBroadcaster: boolean;
  localStream?: MediaStream | null;
  onStreamReceived?: (stream: MediaStream | null) => void;
  onViewerCountChange?: (count: number) => void;
  onChatReceived?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  viewerId: string;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export function useWebRTC({
  streamId,
  isBroadcaster,
  localStream: externalLocalStream,
  onStreamReceived,
  onViewerCountChange,
  onChatReceived,
  onError,
}: WebRTCConfig) {
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const viewerPcRef = useRef<RTCPeerConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const viewerIdRef = useRef<string | null>(null);

  useEffect(() => {
    localStreamRef.current = externalLocalStream || null;
  }, [externalLocalStream]);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/live`;
  }, []);

  const createPeerConnection = useCallback((viewerId?: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "ice-candidate",
          streamId,
          candidate: event.candidate,
          viewerId: viewerId || viewerIdRef.current,
          target: isBroadcaster ? "viewer" : "broadcaster",
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setIsConnected(true);
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setIsConnected(false);
      }
    };

    if (!isBroadcaster) {
      pc.ontrack = (event) => {
        if (event.streams[0] && onStreamReceived) {
          onStreamReceived(event.streams[0]);
        }
      };
    }

    return pc;
  }, [streamId, isBroadcaster, onStreamReceived]);

  const createOfferForViewer = useCallback(async (viewerId: string, ws: WebSocket) => {
    if (!localStreamRef.current) return;
    if (ws.readyState !== WebSocket.OPEN) return;
    
    const pc = createPeerConnection(viewerId);
    peerConnectionsRef.current.set(viewerId, pc);

    localStreamRef.current.getTracks().forEach((track) => {
      const sender = pc.addTrack(track, localStreamRef.current!);
      
      if (track.kind === 'video') {
        const params = sender.getParameters();
        if (!params.encodings) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = 8000000;
        params.encodings[0].maxFramerate = 60;
        params.encodings[0].scaleResolutionDownBy = 1.0;
        sender.setParameters(params).catch(() => {});
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "offer",
        streamId,
        offer,
        viewerId,
        broadcasterId: streamId,
      }));
    }
  }, [streamId, createPeerConnection]);

  const startBroadcast = useCallback(async () => {
    try {
      if (!localStreamRef.current) {
        onError?.("カメラストリームがありません");
        return;
      }

      const ws = new WebSocket(getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "join-as-broadcaster",
          streamId,
        }));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "joined-as-broadcaster":
            setIsConnected(true);
            setViewerCount(message.viewerCount || 0);
            onViewerCountChange?.(message.viewerCount || 0);
            
            // Create offers for existing viewers
            if (message.existingViewers && Array.isArray(message.existingViewers)) {
              for (const viewerId of message.existingViewers) {
                await createOfferForViewer(viewerId, ws);
              }
            }
            break;

          case "viewer-joined":
            setViewerCount(message.viewerCount || 0);
            onViewerCountChange?.(message.viewerCount || 0);
            
            // Create offer for new viewer
            await createOfferForViewer(message.viewerId, ws);
            break;

          case "answer":
            const viewerPc = peerConnectionsRef.current.get(message.viewerId);
            if (viewerPc) {
              await viewerPc.setRemoteDescription(new RTCSessionDescription(message.answer));
            }
            break;

          case "ice-candidate":
            const targetPc = peerConnectionsRef.current.get(message.viewerId);
            if (targetPc && message.candidate) {
              await targetPc.addIceCandidate(new RTCIceCandidate(message.candidate));
            }
            break;

          case "viewer-left":
            setViewerCount(message.viewerCount || 0);
            onViewerCountChange?.(message.viewerCount || 0);
            const leavingPc = peerConnectionsRef.current.get(message.viewerId);
            if (leavingPc) {
              leavingPc.close();
              peerConnectionsRef.current.delete(message.viewerId);
            }
            break;

          case "chat":
            onChatReceived?.(message);
            break;
        }
      };

      ws.onerror = () => {
        onError?.("WebSocket connection failed");
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

    } catch (error: any) {
      onError?.(error.message || "Failed to start broadcast");
    }
  }, [streamId, getWebSocketUrl, createOfferForViewer, onViewerCountChange, onChatReceived, onError]);

  const joinAsViewer = useCallback(() => {
    const ws = new WebSocket(getWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "join-as-viewer",
        streamId,
      }));
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "joined-as-viewer":
          viewerIdRef.current = message.viewerId;
          if (message.broadcasterAvailable) {
            // Wait for offer from broadcaster
          }
          break;

        case "broadcaster-joined":
          // Broadcaster just joined, wait for offer
          break;

        case "offer":
          const pc = createPeerConnection();
          viewerPcRef.current = pc;

          await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "answer",
              streamId,
              answer,
              viewerId: viewerIdRef.current,
            }));
          }
          break;

        case "ice-candidate":
          if (viewerPcRef.current && message.candidate) {
            await viewerPcRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
          break;

        case "broadcaster-left":
          setIsConnected(false);
          onStreamReceived?.(null as any);
          if (viewerPcRef.current) {
            viewerPcRef.current.close();
            viewerPcRef.current = null;
          }
          break;

        case "chat":
          onChatReceived?.(message);
          break;
      }
    };

    ws.onerror = () => {
      onError?.("WebSocket connection failed");
    };

    ws.onclose = () => {
      setIsConnected(false);
    };
  }, [streamId, getWebSocketUrl, createPeerConnection, onStreamReceived, onChatReceived, onError]);

  const stopBroadcast = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave", streamId }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [streamId]);

  const stopViewing = useCallback(() => {
    if (viewerPcRef.current) {
      viewerPcRef.current.close();
      viewerPcRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave", streamId }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, [streamId]);

  const sendChat = useCallback((text: string, username: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat",
        streamId,
        id: Date.now(),
        text,
        username,
      }));
    }
  }, [streamId]);

  useEffect(() => {
    return () => {
      if (isBroadcaster) {
        stopBroadcast();
      } else {
        stopViewing();
      }
    };
  }, [isBroadcaster, stopBroadcast, stopViewing]);

  return {
    isConnected,
    viewerCount,
    startBroadcast,
    stopBroadcast,
    joinAsViewer,
    stopViewing,
    sendChat,
  };
}
