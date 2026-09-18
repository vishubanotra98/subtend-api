import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "node:http";

import { prisma } from "../lib/prisma.js";
import { tokenVerification } from "../helpers/tokenVerification.helper.js";

interface ExtendWebSocket extends WebSocket {
  workspaceId?: string;
  userId?: string;
}

const rooms = new Map<string, Set<ExtendWebSocket>>();

export const initWebSocketServer = (server: any): void => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: ExtendWebSocket, req: IncomingMessage) => {
    try {
      const userId = tokenVerification(req);

      if (!userId) {
        ws.close(1008, "Unauthorized");
        return;
      }

      ws.userId = userId;

      ws.on("message", async (raw) => {
        try {
          const data = JSON.parse(raw.toString());

          if (data?.type === "SUBSCRIBE") {
            await subscribeToWorkspace(ws, data);
          }
        } catch (error) {
          console.error("[WS] Failed to process message:", error);
        }
      });

      ws.on("close", () => {
        handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error("[WS] Connection error:", error);
      });
    } catch (error) {
      console.error("[WS] Authentication failed:", error);
      ws.close(1008, "Unauthorized");
    }
  });
};

async function subscribeToWorkspace(ws: ExtendWebSocket, data: unknown) {
  if (!data || typeof data !== "object") return;

  const { workspaceId } = data as { workspaceId: string };

  if (typeof workspaceId !== "string" || !workspaceId.trim()) {
    return;
  }

  const userId = ws.userId;

  if (!userId) return;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: {
          userId,
        },
      },
    },
  });

  if (!workspace) {
    return;
  }

  if (ws.workspaceId === workspaceId) {
    return;
  }

  if (ws.workspaceId) {
    removeSocketFromRoom(ws, ws.workspaceId);
  }

  ws.workspaceId = workspaceId;

  if (!rooms.get(workspaceId)) {
    rooms.set(workspaceId, new Set());
  }

  rooms.get(workspaceId).add(ws);

  console.log(`[WS] User ${userId} subscribed to workspace ${workspaceId}`);
}

function removeSocketFromRoom(ws: ExtendWebSocket, workspaceId: string): void {
  const room = rooms.get(workspaceId);

  if (!room) return;

  room.delete(ws);

  if (room.size === 0) {
    rooms.delete(workspaceId);
  }
}

function handleDisconnect(ws: ExtendWebSocket): void {
  if (ws.workspaceId) {
    removeSocketFromRoom(ws, ws.workspaceId);
  }

  console.log(`[WS] Client disconnected (${ws.userId ?? "unidentified"})`);
}

export function broadcastToWorkspace(
  workspaceId: string,
  eventType: string,
  payload: unknown,
): void {
  const room = rooms.get(workspaceId);

  if (!room) return;

  const message = JSON.stringify({
    eventType,
    payload,
  });

  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
