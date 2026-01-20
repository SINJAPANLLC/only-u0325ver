import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface StreamRoom {
  broadcaster: WebSocket | null;
  viewers: Set<WebSocket>;
  streamId: string;
}

const rooms = new Map<string, StreamRoom>();

export function setupWebRTCSignaling(httpServer: Server) {
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws/live" 
  });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoom: string | null = null;
    let isBroadcaster = false;

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "join-as-broadcaster":
            handleBroadcasterJoin(ws, message.streamId);
            currentRoom = message.streamId;
            isBroadcaster = true;
            break;

          case "join-as-viewer":
            handleViewerJoin(ws, message.streamId);
            currentRoom = message.streamId;
            isBroadcaster = false;
            break;

          case "offer":
            forwardToViewer(message.streamId, message.viewerId, {
              type: "offer",
              offer: message.offer,
              broadcasterId: message.broadcasterId,
            });
            break;

          case "answer":
            forwardToBroadcaster(message.streamId, {
              type: "answer",
              answer: message.answer,
              viewerId: message.viewerId,
            });
            break;

          case "ice-candidate":
            if (message.target === "broadcaster") {
              forwardToBroadcaster(message.streamId, {
                type: "ice-candidate",
                candidate: message.candidate,
                viewerId: message.viewerId,
              });
            } else {
              forwardToViewer(message.streamId, message.viewerId, {
                type: "ice-candidate",
                candidate: message.candidate,
              });
            }
            break;

          case "leave":
            handleLeave(ws, currentRoom, isBroadcaster);
            currentRoom = null;
            break;

          case "chat":
            broadcastChat(message.streamId, {
              type: "chat",
              id: message.id,
              text: message.text,
              username: message.username,
              senderId: (ws as any).viewerId || "broadcaster",
            });
            break;
        }
      } catch (error) {
        console.error("WebRTC signaling error:", error);
      }
    });

    ws.on("close", () => {
      handleLeave(ws, currentRoom, isBroadcaster);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      handleLeave(ws, currentRoom, isBroadcaster);
    });
  });

  console.log("WebRTC signaling server started on /ws/live");
  return wss;
}

function handleBroadcasterJoin(ws: WebSocket, streamId: string) {
  let room = rooms.get(streamId);
  if (!room) {
    room = {
      broadcaster: null,
      viewers: new Set(),
      streamId,
    };
    rooms.set(streamId, room);
  }

  room.broadcaster = ws;
  
  // Collect existing viewer IDs
  const existingViewerIds: string[] = [];
  room.viewers.forEach((viewer) => {
    const viewerId = (viewer as any).viewerId;
    if (viewerId) {
      existingViewerIds.push(viewerId);
    }
    // Notify existing viewers that broadcaster is available
    sendToSocket(viewer, {
      type: "broadcaster-joined",
      streamId,
    });
  });

  sendToSocket(ws, {
    type: "joined-as-broadcaster",
    streamId,
    viewerCount: room.viewers.size,
    existingViewers: existingViewerIds,
  });
}

function handleViewerJoin(ws: WebSocket, streamId: string) {
  let room = rooms.get(streamId);
  if (!room) {
    room = {
      broadcaster: null,
      viewers: new Set(),
      streamId,
    };
    rooms.set(streamId, room);
  }

  room.viewers.add(ws);
  
  const viewerId = generateViewerId();
  (ws as any).viewerId = viewerId;

  sendToSocket(ws, {
    type: "joined-as-viewer",
    streamId,
    viewerId,
    broadcasterAvailable: room.broadcaster !== null,
  });

  // Notify broadcaster of new viewer
  if (room.broadcaster) {
    sendToSocket(room.broadcaster, {
      type: "viewer-joined",
      viewerId,
      viewerCount: room.viewers.size,
    });
  }
}

function handleLeave(ws: WebSocket, streamId: string | null, isBroadcaster: boolean) {
  if (!streamId) return;

  const room = rooms.get(streamId);
  if (!room) return;

  if (isBroadcaster) {
    room.broadcaster = null;
    // Notify all viewers that broadcast ended
    room.viewers.forEach((viewer) => {
      sendToSocket(viewer, {
        type: "broadcaster-left",
        streamId,
      });
    });
  } else {
    room.viewers.delete(ws);
    const viewerId = (ws as any).viewerId;
    
    // Notify broadcaster of viewer leaving
    if (room.broadcaster && viewerId) {
      sendToSocket(room.broadcaster, {
        type: "viewer-left",
        viewerId,
        viewerCount: room.viewers.size,
      });
    }
  }

  // Clean up empty rooms
  if (!room.broadcaster && room.viewers.size === 0) {
    rooms.delete(streamId);
  }
}

function forwardToBroadcaster(streamId: string, message: any) {
  const room = rooms.get(streamId);
  if (room?.broadcaster) {
    sendToSocket(room.broadcaster, message);
  }
}

function forwardToViewer(streamId: string, viewerId: string, message: any) {
  const room = rooms.get(streamId);
  if (!room) return;

  room.viewers.forEach((viewer) => {
    if ((viewer as any).viewerId === viewerId) {
      sendToSocket(viewer, message);
    }
  });
}

function sendToSocket(ws: WebSocket, message: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function generateViewerId(): string {
  return `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function broadcastChat(streamId: string, message: any) {
  const room = rooms.get(streamId);
  if (!room) return;

  // Send to broadcaster
  if (room.broadcaster) {
    sendToSocket(room.broadcaster, message);
  }

  // Send to all viewers
  room.viewers.forEach((viewer) => {
    sendToSocket(viewer, message);
  });
}
