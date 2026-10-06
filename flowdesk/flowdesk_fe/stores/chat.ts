import { defineStore } from "pinia";
import type { ChatRoom, ChatMessage } from "~/types/chat";

function cleanUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const markdownUrl = trimmed.match(/^\[[^\]]+\]\((https?:\/\/.+)\)$/);
  return markdownUrl?.[1] ?? trimmed;
}

function normalizeRoom(room: ChatRoom): ChatRoom {
  return {
    ...room,
    avatarUrl: cleanUrl(room.avatarUrl),
    isOwner: room.isOwner ?? room.owner ?? false,
  };
}

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
      this.rooms = rooms.map(normalizeRoom);
    },

    prependRoom(room: ChatRoom) {
      const normalized = normalizeRoom(room);
      this.rooms = [
        normalized,
        ...this.rooms.filter((r) => r.id !== normalized.id),
      ];
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

    /** Nhận message qua realtime. Message cũ thì replace, message mới thì append. */
    appendMessage(msg: ChatMessage) {
      const roomId = msg.roomId;
      if (!this.messages[roomId]) this.messages[roomId] = [];
      const existingIndex = this.messages[roomId].findIndex((m) => m.id === msg.id);
      if (existingIndex !== -1) {
        this.messages[roomId][existingIndex] = msg;
        this.updateRoomLastMessage(roomId, msg);
        return;
      }
      this.messages[roomId].push(msg);

      // Cập nhật lastMessage + sort room lên đầu
      const idx = this.rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        const room = { ...this.rooms[idx] };
        room.lastMessage = this.messageSummary(msg);
        room.lastMessageAt = msg.createdAt;
        if (roomId !== this.activeRoomId) {
          room.unreadCount = (room.unreadCount ?? 0) + 1;
        }
        this.rooms = [room, ...this.rooms.filter((r) => r.id !== roomId)];
      }
    },

    updateMessage(msg: ChatMessage) {
      const roomId = msg.roomId;
      const existingIndex = this.messages[roomId]?.findIndex((m) => m.id === msg.id) ?? -1;
      if (existingIndex !== -1) {
        this.messages[roomId][existingIndex] = msg;
      }
      this.updateRoomLastMessage(roomId, msg);
    },

    updateRoomLastMessage(roomId: number, msg: ChatMessage) {
      const room = this.rooms.find((r) => r.id === roomId);
      if (!room || room.lastMessageAt !== msg.createdAt) return;
      room.lastMessage = this.messageSummary(msg);
    },

    messageSummary(msg: ChatMessage): string | null {
      if (msg.isRecalled) return "Tin nhắn đã được thu hồi";
      if (msg.type === "IMAGE") return "Đã gửi ảnh";
      if (msg.type === "FILE") return msg.fileName ?? "File";
      if (msg.type === "VIDEO") return "Đã gửi video";
      if (msg.type === "AUDIO") return "Đã gửi audio";
      return msg.content;
    },

    clearUnread(roomId: number) {
      const room = this.rooms.find((r) => r.id === roomId);
      if (room) room.unreadCount = 0;
    },

    updateRoom(updated: ChatRoom) {
      const normalized = normalizeRoom(updated);
      const idx = this.rooms.findIndex((r) => r.id === updated.id);
      if (idx !== -1) this.rooms[idx] = { ...this.rooms[idx], ...normalized };
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
