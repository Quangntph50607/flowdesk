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
    isMuted: room.isMuted ?? room.muted ?? false,
    isPinned: room.isPinned ?? room.pinned ?? false,
  };
}

function sortRooms(rooms: ChatRoom[]): ChatRoom[] {
  return [...rooms].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    rooms: [] as ChatRoom[],
    activeRoomId: null as number | null,
    messages: {} as Record<number, ChatMessage[]>,
    hasMore: {} as Record<number, boolean>,
    /** Tổng số conversation trên server (để biết còn "tải thêm" không). */
    roomsTotal: 0,
    /** Tổng tin chưa đọc toàn app (không tính room đã mute) — badge menu. */
    globalUnread: 0,
  }),

  getters: {
    activeRoom: (state): ChatRoom | null =>
      state.rooms.find((r) => r.id === state.activeRoomId) ?? null,

    unreadTotal: (state): number =>
      state.rooms.reduce((sum, r) => sum + (r.unreadCount ?? 0), 0),

    hasMoreRooms: (state): boolean => state.rooms.length < state.roomsTotal,

    roomMessages:
      (state) =>
      (roomId: number): ChatMessage[] =>
        state.messages[roomId] ?? [],
  },

  actions: {
    setRooms(rooms: ChatRoom[], total?: number) {
      this.rooms = sortRooms(rooms.map(normalizeRoom));
      this.roomsTotal = total ?? rooms.length;
    },

    /** Nối thêm trang conversation tiếp theo (bỏ trùng). */
    appendRooms(rooms: ChatRoom[], total: number) {
      const existing = new Set(this.rooms.map((r) => r.id));
      this.rooms = sortRooms([
        ...this.rooms,
        ...rooms.filter((r) => !existing.has(r.id)).map(normalizeRoom),
      ]);
      this.roomsTotal = total;
    },

    setGlobalUnread(total: number) {
      this.globalUnread = Math.max(0, total);
    },

    prependRoom(room: ChatRoom) {
      const normalized = normalizeRoom(room);
      if (!this.rooms.some((r) => r.id === normalized.id)) this.roomsTotal += 1;
      this.rooms = sortRooms([
        normalized,
        ...this.rooms.filter((r) => r.id !== normalized.id),
      ]);
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
        const current = this.messages[roomId] ?? [];
        const existing = new Set(current.map((m) => m.id));
        this.messages[roomId] = [...reversed.filter((m) => !existing.has(m.id)), ...current];
      }
    },

    /** Nhận message qua realtime. Message cũ thì replace, message mới thì append. */
    appendMessage(msg: ChatMessage, currentUserId?: number) {
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
        // Tin của chính mình (gửi từ tab/thiết bị khác) không tính là chưa đọc
        if (roomId !== this.activeRoomId && msg.senderId !== currentUserId) {
          room.unreadCount = (room.unreadCount ?? 0) + 1;
        }
        this.rooms = sortRooms([room, ...this.rooms.filter((r) => r.id !== roomId)]);
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
      if (idx !== -1) {
        this.rooms[idx] = { ...this.rooms[idx], ...normalized };
        this.rooms = sortRooms(this.rooms);
      }
    },

    removeRoom(roomId: number) {
      if (this.rooms.some((r) => r.id === roomId)) this.roomsTotal = Math.max(0, this.roomsTotal - 1);
      this.rooms = this.rooms.filter((r) => r.id !== roomId);
      if (this.activeRoomId === roomId) this.activeRoomId = null;
    },

    setHasMore(roomId: number, value: boolean) {
      this.hasMore[roomId] = value;
    },


    reset() {
      this.rooms = [];
      this.activeRoomId = null;
      this.messages = {};
      this.hasMore = {};
      this.roomsTotal = 0;
    },
  },
});
