import "./config/env.js";
import "./workers/email.worker.js";
import "./workers/deletion.worker.js";
import app, { server } from "./app.js";
import { PORT } from "./constants/constant.js";
import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ server });

interface ExtendWebSocket extends WebSocket {
  workspaceId?: string;
  userId?: string;
}

const rooms = new Map<string, Set<ExtendWebSocket>>();

wss.on("connection", (ws: ExtendWebSocket) => {
  console.log("[WS] Connection opened successfully");

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data?.type === "SUBSCRIBE") {
        const { workspaceId, userId } = data;

        if (ws.workspaceId && rooms.has(ws.workspaceId)) {
          rooms.get(ws.workspaceId)?.delete(ws);
        }

        ws.workspaceId = workspaceId;
        ws.userId = userId;

        if (!rooms.has(workspaceId)) {
          rooms.set(workspaceId, new Set());
        }
        rooms.get(workspaceId)!.add(ws);

        console.log(
          `[WS] User "${userId}" subscribed to room: "${workspaceId}"`,
        );
      }

      const data1 = {
        type: "WORKSPACE_EVENT",
        eventType: "TEST_PING",
        payload: { from: "Browser Tab", text: "Hello at 22:39:44" },
      };

      if (data.type === "WORKSPACE_EVENT") {
        const room = ws.workspaceId ? rooms.get(ws.workspaceId) : null;
        if (!room) return;

        const outgoingMessage = JSON.stringify({
          eventType: data.eventType,
          senderId: ws.userId,
          payload: data.payload,
        });

        room.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(outgoingMessage);
          }
        });
      }
    } catch (err) {
      console.error("[WS] Failed to parse message:", err);
    }
  });

  ws.on("close", () => {
    if (ws.workspaceId && rooms.has(ws.workspaceId)) {
      const room = rooms.get(ws.workspaceId);
      room?.delete(ws);
      if (room && room.size === 0) {
        rooms.delete(ws.workspaceId);
      }
    }
    console.log(`[WS] Client disconnected (${ws.userId || "unidentified"})`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT : ${PORT}`);
});
