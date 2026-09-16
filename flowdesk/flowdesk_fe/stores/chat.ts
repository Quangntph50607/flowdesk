import { defineStore } from "pinia";
import type { ChatRoom, ChatMessage } from "~/types/chat";

export const useChatStore = defineStore("chat", {
  state: () => ({
    rooms: [] as ChatRoom[],
    activeRoomId: null as number | null,
    messages: {} as Record<number, ChatMessage[]>,
    hasMore: {} as Record<number, boolean>,
    currentPage: {} as Record<number, number>,
  }),

  getters: {
    activeRoom: (state): ChatRoom | null =>
      state.rooms.find((r) => r.id === state.activeRoomId) ?? null,

    unreadTotal: (state): number =>
      state.rooms.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0),

    roomMessages:
      (state) =>
      (roomId: number): ChatMessage[] =>
        state.messages[roomId] ?? [],
  },

  actions: {
    setRooms(rooms: ChatRoom[]) {
      this.rooms = rooms;
    },

    setActiveRoom(id: number | null) {
      this.activeRoomId = id;
    },

    /**
     * Set messages cho room.
     * API trả về mới nhất trước (page 0, DESC) nên reverse lại để hiển thị cũ→mới.
     * isFirstPage=true: replace; false: prepend (load more).
     */
    setMessages(roomId: number, msgs: ChatMessage[], isFirstPage: boolean) {
      const reversed = [...msgs].reverse();
      if (isFirstPage) {
        this.messages[roomId] = reversed;
      } else {
        this.messages[roomId] = [...reversed, ...(this.messages[roomId] ?? [])];
      }
    },

    /** Nhận 1 message mới qua realtime → append và cập nhật room list. */
    appendMessage(msg: ChatMessage) {
      const roomId = msg.roomId;
      if (!this.messages[roomId]) this.messages[roomId] = [];
      this.messages[roomId].push(msg);

      // Cập nhật lastMessage + sort room lên đầu
      const idx = this.rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        const room = { ...this.rooms[idx] };
        room.lastMessage = msg.isRecalled
          ? "Tin nhắn đã được thu hồi"
          : msg.type === "IMAGE"
            ? "🖼️ Đã gửi ảnh"
            : msg.type === "FILE"
              ? `📎 ${msg.fileName ?? "File"}`
              : msg.type === "VIDEO"
                ? "🎥 Đã gửi video"
                : msg.type === "AUDIO"
                  ? "🎵 Đã gửi audio"
                  : msg.type === "SYSTEM"
                    ? msg.content
                    : msg.content;
        room.lastMessageAt = msg.createdAt;
        if (roomId !== this.activeRoomId) {
          room.unreadCount = (room.unreadCount ?? 0) + 1;
        }
        this.rooms = [room, ...this.rooms.filter((r) => r.id !== roomId)];
      }
    },

    clearUnread(roomId: number) {
      const room = this.rooms.find((r) => r.id === roomId);
      if (room) room.unreadCount = 0;
    },

    updateRoom(updated: ChatRoom) {
      const idx = this.rooms.findIndex((r) => r.id === updated.id);
      if (idx !== -1) this.rooms[idx] = updated;
    },

    removeRoom(roomId: number) {
      this.rooms = this.rooms.filter((r) => r.id !== roomId);
      if (this.activeRoomId === roomId) this.activeRoomId = null;
    },

    setHasMore(roomId: number, value: boolean) {
      this.hasMore[roomId] = value;
    },

    setCurrentPage(roomId: number, page: number) {
      this.currentPage[roomId] = page;
    },

    reset() {
      this.rooms = [];
      this.activeRoomId = null;
      this.messages = {};
      this.hasMore = {};
      this.currentPage = {};
    },
  },
});
