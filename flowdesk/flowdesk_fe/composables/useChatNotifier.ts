import { useChatStore } from "~/stores/chat";

/**
 * Chạy ở layout (mọi trang dashboard):
 * - Mở kết nối WebSocket dùng chung + gửi heartbeat để hiện "Đang hoạt động".
 * - Cập nhật badge tổng tin chưa đọc trên menu.
 * - Thông báo tin mới (toast khi ở trang khác, thông báo trình duyệt khi tab bị ẩn).
 *   Conversation đã tắt thông báo (mute) thì không báo và không tính vào badge.
 */
export function useChatNotifier() {
  const chat = useChat();
  const chatApi = useChatApi();
  const chatStore = useChatStore();
  const toast = useAppToast();
  const route = useRoute();
  const router = useRouter();

  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let offUserEvent: (() => void) | null = null;

  async function refreshUnread() {
    try {
      chatStore.setGlobalUnread(await chatApi.getUnreadSummary());
    } catch {
      /* non-critical */
    }
  }

  function onConnected() {
    chat.sendHeartbeat();
    refreshUnread();
  }

  function isViewingRoom(roomId: number): boolean {
    return (
      route.path.startsWith("/dashboard/chat") &&
      chatStore.activeRoomId === roomId &&
      document.visibilityState === "visible"
    );
  }

  function openRoom(event: any) {
    router.push({
      path: "/dashboard/chat",
      query: { ws: String(event.workspaceId), room: String(event.roomId) },
    });
  }

  function notify(event: any) {
    const isGroup = event.roomType === "GROUP";
    const title = isGroup ? event.roomName ?? "Nhóm" : event.senderName ?? "Tin nhắn mới";
    const body = isGroup ? `${event.senderName}: ${event.preview ?? ""}` : event.preview ?? "";

    if (
      document.visibilityState !== "visible" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const n = new Notification(title, { body, tag: `chat-${event.roomId}` });
      n.onclick = () => {
        window.focus();
        openRoom(event);
        n.close();
      };
      return;
    }

    // Đang ở trang chat thì sidebar đã hiện unread, không cần toast
    if (!route.path.startsWith("/dashboard/chat")) {
      toast.add({ severity: "info", summary: title, detail: body, life: 4000 });
    }
  }

  function handleUserEvent(event: any) {
    switch (event?.eventType) {
      case "NEW_MESSAGE":
        if (event.muted || isViewingRoom(event.roomId)) return;
        chatStore.setGlobalUnread(chatStore.globalUnread + 1);
        notify(event);
        break;
      case "ROOM_ADDED":
      case "ROOM_REMOVED":
        refreshUnread();
        break;
    }
  }

  /** Xin quyền thông báo trình duyệt ở lần click đầu tiên (trình duyệt yêu cầu thao tác người dùng). */
  function requestPermissionOnFirstClick() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    const handler = () => {
      Notification.requestPermission().catch(() => {});
    };
    window.addEventListener("click", handler, { once: true });
  }

  function start() {
    chat.connect(onConnected);
    offUserEvent = chat.onUserEvent(handleUserEvent);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => chat.sendHeartbeat(), 20000);
    requestPermissionOnFirstClick();
  }

  function stop() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    offUserEvent?.();
    offUserEvent = null;
    chat.disconnect();
  }

  return { start, stop, refreshUnread };
}
