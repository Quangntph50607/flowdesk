import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Kết nối WebSocket / STOMP dùng chung cho toàn app (1 kết nối / tab).
 *
 * - Layout mở kết nối khi đăng nhập (badge unread, thông báo, heartbeat online).
 * - Trang chat dùng lại kết nối đó để subscribe room / presence,
 *   và khi rời trang chỉ hủy subscription của mình (releaseRooms), không ngắt kết nối.
 */

// ── State dùng chung (module-level) ──────────────────────────────
let client: Client | null = null;
const subscriptions = new Map<string, StompSubscription>();
const connectListeners = new Set<() => void>();
const userEventListeners = new Set<(event: any) => void>();

function readAccessToken(): string {
  // Đọc trực tiếp cookie để luôn lấy token mới nhất (có thể vừa được refresh)
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function parse(frame: IMessage): any {
  try {
    return JSON.parse(frame.body);
  } catch {
    console.error("[WS] Parse error", frame.body);
    return null;
  }
}

/** Kênh riêng của user: NEW_MESSAGE / ROOM_ADDED / ROOM_REMOVED. */
function ensureUserSubscription() {
  if (!client?.connected || subscriptions.has("user-chat")) return;
  subscriptions.set(
    "user-chat",
    client.subscribe("/user/queue/chat", (frame) => {
      const event = parse(frame);
      if (event) userEventListeners.forEach((fn) => fn(event));
    }),
  );
}

export const useChat = () => {
  const config = useRuntimeConfig();

  /**
   * Mở kết nối (nếu chưa có). onConnected được gọi mỗi lần (re)connect;
   * nếu đã kết nối sẵn thì gọi ngay.
   */
  function connect(onConnected?: () => void) {
    if (onConnected) connectListeners.add(onConnected);
    if (client?.connected) {
      onConnected?.();
      return;
    }
    if (client?.active) return; // đang kết nối, listener sẽ được gọi khi xong

    client = new Client({
      webSocketFactory: () =>
        new SockJS(`${config.public.apiBase}/ws`) as unknown as WebSocket,
      reconnectDelay: 5000,
      beforeConnect: () => {
        if (client) {
          client.connectHeaders = { Authorization: `Bearer ${readAccessToken()}` };
        }
      },
      onConnect: () => {
        // Sau reconnect, các subscription cũ đã mất → xóa để subscribe lại
        subscriptions.clear();
        ensureUserSubscription();
        connectListeners.forEach((fn) => fn());
      },
      onStompError: (frame) => {
        console.error("[WS] STOMP error", frame.headers?.message);
      },
    });

    client.activate();
  }

  function offConnected(fn: () => void) {
    connectListeners.delete(fn);
  }

  /** Ngắt hẳn kết nối (khi đăng xuất / layout unmount). */
  function disconnect() {
    subscriptions.forEach((sub) => sub.unsubscribe());
    subscriptions.clear();
    connectListeners.clear();
    userEventListeners.clear();
    client?.deactivate();
    client = null;
  }

  /** Hủy toàn bộ subscription room + presence (giữ kết nối và kênh riêng của user). */
  function releaseRooms() {
    for (const [key, sub] of subscriptions) {
      if (key.startsWith("room-") || key.startsWith("presence-")) {
        sub.unsubscribe();
        subscriptions.delete(key);
      }
    }
  }

  /** Lắng nghe event riêng của user. Trả về hàm hủy. */
  function onUserEvent(fn: (event: any) => void): () => void {
    userEventListeners.add(fn);
    ensureUserSubscription();
    return () => userEventListeners.delete(fn);
  }

  function subscribeRoom(roomId: number, onMessage: (msg: any) => void) {
    if (!client?.connected) return;
    const key = `room-${roomId}`;
    if (subscriptions.has(key)) return; // đã subscribe
    subscriptions.set(
      key,
      client.subscribe(`/topic/room/${roomId}`, (frame) => {
        const msg = parse(frame);
        if (msg) onMessage(msg);
      }),
    );
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

  /** Tên hiển thị do server tự lấy từ DB, client chỉ gửi trạng thái. */
  function sendWsTyping(roomId: number, typing: boolean) {
    if (!client?.connected) return;
    client.publish({
      destination: `/app/chat/${roomId}/typing`,
      body: JSON.stringify({ typing }),
    });
  }

  /** Presence của các thành viên trong workspace tổng (rootWorkspaceId). */
  function subscribePresence(rootWorkspaceId: number, onEvent: (event: any) => void) {
    const key = `presence-${rootWorkspaceId}`;
    if (!client?.connected || subscriptions.has(key)) return;
    subscriptions.set(
      key,
      client.subscribe(`/topic/workspace/${rootWorkspaceId}/presence`, (frame) => {
        const event = parse(frame);
        if (event) onEvent(event);
      }),
    );
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
    offConnected,
    disconnect,
    releaseRooms,
    onUserEvent,
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
