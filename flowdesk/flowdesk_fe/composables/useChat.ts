import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Composable quản lý kết nối WebSocket / STOMP cho chat nội bộ.
 * Dùng chung 1 instance client cho toàn bộ session.
 * Gọi connect() 1 lần khi mount trang chat, disconnect() khi unmount.
 */
export const useChat = () => {
  const config = useRuntimeConfig();
  const token = useCookie("access_token");

  let client: Client | null = null;
  const subscriptions = new Map<string, ReturnType<Client["subscribe"]>>();

  function connect(onConnected?: () => void) {
    if (client?.active) return; // đã connect rồi

    client = new Client({
      webSocketFactory: () =>
        new SockJS(`${config.public.apiBase}/ws`) as unknown as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token.value ?? ""}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        onConnected?.();
      },
      onStompError: (frame) => {
        console.error("[WS] STOMP error", frame.headers?.message);
      },
      onDisconnect: () => {
        console.log("[WS] Disconnected");
      },
    });

    client.activate();
  }

  function disconnect() {
    subscriptions.forEach((sub) => sub.unsubscribe());
    subscriptions.clear();
    client?.deactivate();
    client = null;
  }

  function subscribeRoom(roomId: number, onMessage: (msg: any) => void) {
    if (!client?.connected) return;
    const key = `room-${roomId}`;
    if (subscriptions.has(key)) return; // đã subscribe
    const sub = client.subscribe(`/topic/room/${roomId}`, (frame: IMessage) => {
      try {
        onMessage(JSON.parse(frame.body));
      } catch {
        console.error("[WS] Parse error", frame.body);
      }
    });
    subscriptions.set(key, sub);
  }

  function unsubscribeRoom(roomId: number) {
    const key = `room-${roomId}`;
    subscriptions.get(key)?.unsubscribe();
    subscriptions.delete(key);
  }

  function sendWsMessage(
    roomId: number,
    content: string,
    replyToMessageId?: number | null,
  ) {
    if (!client?.connected) {
      console.warn("[WS] Not connected, cannot send");
      return;
    }
    client.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({ type: "TEXT", content, replyToMessageId }),
    });
  }

  function sendWsFile(
    roomId: number,
    fileUrl: string,
    fileType: "IMAGE" | "FILE" | "VIDEO" | "AUDIO",
    fileName: string,
    fileSize: number,
    replyToMessageId?: number | null,
  ) {
    if (!client?.connected) {
      console.warn("[WS] Not connected, cannot send file");
      return;
    }
    client.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({
        type: fileType,
        content: fileUrl,
        fileName,
        fileSize,
        replyToMessageId,
      }),
    });
  }

  function sendWsTyping(roomId: number, userName: string, typing: boolean) {
    if (!client?.connected) return;
    client.publish({
      destination: `/app/chat/${roomId}/typing`,
      body: JSON.stringify({ typing, userName }),
    });
  }

  function subscribePresence(onEvent: (event: any) => void) {
    if (!client?.connected || subscriptions.has("presence")) return;
    subscriptions.set("presence", client.subscribe("/topic/presence", (frame) => {
      try { onEvent(JSON.parse(frame.body)); } catch { /* ignore malformed event */ }
    }));
  }

  function sendHeartbeat() {
    if (!client?.connected) return;
    client.publish({ destination: "/app/presence/heartbeat", body: "{}" });
  }

  function isConnected(): boolean {
    return client?.connected ?? false;
  }

  return {
    connect,
    disconnect,
    subscribeRoom,
    unsubscribeRoom,
    sendWsMessage,
    sendWsFile,
    sendWsTyping,
    subscribePresence,
    sendHeartbeat,
    isConnected,
  };
};
