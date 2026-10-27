/**
 * Composable tập trung toàn bộ API call liên quan đến module Chat nội bộ.
 *
 * Mục đích:
 *  - Tách logic HTTP khỏi trang chat/index.vue, dễ test, dễ tái sử dụng.
 *  - Mọi endpoint chat đều đi qua đây, trả về dữ liệu đã "unwrap" ApiResponse.
 *
 * Pattern:
 *   const chatApi = useChatApi();
 *   const rooms = await chatApi.getRooms(workspaceId, { limit, page });
 *
 * Mọi function đều throw error khi backend trả lỗi, để caller tự try/catch.
 */
import type {
  ChatMessage,
  ChatLinkItem,
  ChatRoom,
  ReadReceipt,
} from "~/types/chat";

/** Payload tạo group mới. */
export interface CreateGroupPayload {
  name: string;
  avatarUrl?: string | null;
  description?: string | null;
  memberIds: number[];
}

/** Kết quả trả về của getRoomMembers (bao gồm members + shared content). */
export interface RoomMembersResult {
  total: number;
  members: Array<{
    userId: number;
    fullName: string;
    email?: string | null;
    avatarInitial?: string | null;
    avatarUrl?: string | null;
    isOwner: boolean;
    isMuted: boolean;
    isPinned: boolean;
  }>;
  media: ChatMessage[];
  links: ChatLinkItem[];
  docs: ChatMessage[];
}

/** Thông tin phân trang cho REST API (1-indexed cho list, 0-indexed cho messages). */
export interface PageParams {
  page?: number;
  size?: number;
  limit?: number;
}

export const useChatApi = () => {
  const api = useApi();

  /**
   * Helper unwrap ApiResponse → data.
   * Backend trả { code, message, data } → ta chỉ quan tâm data.
   */
  function unwrap<T>(res: { data: { data: T } }): T {
    return res.data.data;
  }

  function buildPath(workspaceId: number, sub: string): string {
    return `/api/workspaces/${workspaceId}/chat${sub}`;
  }

  // ── Rooms (sidebar) ─────────────────────────────────────────────

  /** Lấy danh sách conversation của current user trong workspace. */
  async function getRooms(
    workspaceId: number,
    params: PageParams = {},
  ): Promise<ChatRoom[]> {
    const res = await api.get(buildPath(workspaceId, "/rooms"), {
      params: { limit: params.limit ?? 20, page: params.page ?? 1 },
    });
    return getPageItems(unwrap(res));
  }

  /**
   * Tìm kiếm conversation theo từ khóa (tên người trong DIRECT hoặc tên nhóm).
   * Trả về danh sách đã sort pinned trước, updatedAt DESC.
   */
  async function searchRooms(
    workspaceId: number,
    keyword: string,
  ): Promise<ChatRoom[]> {
    const res = await api.get(buildPath(workspaceId, "/rooms/search"), {
      params: { keyword },
    });
    return unwrap(res);
  }

  /** Mở hoặc tạo cuộc chat 1-1 với targetUserId. */
  async function openDirect(
    workspaceId: number,
    targetUserId: number,
  ): Promise<ChatRoom> {
    const res = await api.post(buildPath(workspaceId, "/rooms/direct"), {
      targetUserId,
    });
    return unwrap(res);
  }

  /** Tạo group mới. */
  async function createGroup(
    workspaceId: number,
    payload: CreateGroupPayload,
  ): Promise<ChatRoom> {
    const res = await api.post(buildPath(workspaceId, "/rooms/group"), payload);
    return unwrap(res);
  }

  // ── Messages ─────────────────────────────────────────────────────

  /**
   * Lấy lịch sử tin nhắn trong room (phân trang, mới nhất trước).
   * `page` 0-indexed. Mặc định size = 30.
   */
  async function getMessages(
    workspaceId: number,
    roomId: number,
    page: number = 0,
    size: number = 30,
  ): Promise<{
    content: ChatMessage[];
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    number: number;
  }> {
    const res = await api.get(
      buildPath(workspaceId, `/rooms/${roomId}/messages`),
      { params: { page, size } },
    );
    return unwrap(res);
  }

  /**
   * Tìm kiếm tin nhắn theo từ khóa trong một conversation.
   * Chỉ tìm tin TEXT chưa recall. Phân trang mới nhất trước.
   */
  async function searchMessages(
    workspaceId: number,
    roomId: number,
    keyword: string,
    page: number = 0,
    size: number = 20,
  ): Promise<{
    content: ChatMessage[];
    totalElements: number;
    totalPages: number;
    last: boolean;
    first: boolean;
    number: number;
  }> {
    const res = await api.get(
      buildPath(workspaceId, `/rooms/${roomId}/messages/search`),
      { params: { keyword, page, size } },
    );
    return unwrap(res);
  }

  /** Đánh dấu đã đọc toàn bộ tin nhắn trong room (unread → 0). */
  async function markRead(workspaceId: number, roomId: number): Promise<void> {
    await api.post(buildPath(workspaceId, `/rooms/${roomId}/read`));
  }

  /** Sửa nội dung tin nhắn TEXT của chính mình. */
  async function editMessage(
    workspaceId: number,
    roomId: number,
    messageId: number,
    content: string,
  ): Promise<ChatMessage> {
    const res = await api.patch(
      buildPath(workspaceId, `/rooms/${roomId}/messages/${messageId}`),
      { content },
    );
    return unwrap(res);
  }

  /** Thu hồi tin nhắn của chính mình (chỉ TEXT/IMAGE/FILE/VIDEO/AUDIO, không phải SYSTEM). */
  async function recallMessage(
    workspaceId: number,
    roomId: number,
    messageId: number,
  ): Promise<ChatMessage> {
    const res = await api.patch(
      buildPath(workspaceId, `/rooms/${roomId}/messages/${messageId}/recall`),
    );
    return unwrap(res);
  }

  // ── Pin / Mute ──────────────────────────────────────────────────

  /** Toggle pin conversation (riêng theo từng user). */
  async function togglePin(
    workspaceId: number,
    roomId: number,
  ): Promise<ChatRoom> {
    const res = await api.patch(buildPath(workspaceId, `/rooms/${roomId}/pin`));
    return unwrap(res);
  }

  /** Toggle mute notification (riêng theo từng user). */
  async function toggleMute(
    workspaceId: number,
    roomId: number,
  ): Promise<ChatRoom> {
    const res = await api.patch(
      buildPath(workspaceId, `/rooms/${roomId}/mute`),
    );
    return unwrap(res);
  }

  // ── Group management ─────────────────────────────────────────────

  /** Đổi tên group (chỉ trưởng nhóm). */
  async function renameGroup(
    workspaceId: number,
    roomId: number,
    newName: string,
  ): Promise<ChatRoom> {
    const res = await api.patch(
      buildPath(workspaceId, `/rooms/${roomId}/name`),
      null,
      { params: { name: newName } },
    );
    return unwrap(res);
  }

  /** Cập nhật avatar group (chỉ trưởng nhóm). */
  async function updateGroupAvatar(
    workspaceId: number,
    roomId: number,
    avatarUrl: string | null,
  ): Promise<ChatRoom> {
    const res = await api.patch(
      buildPath(workspaceId, `/rooms/${roomId}/avatar`),
      null,
      { params: { avatarUrl } },
    );
    return unwrap(res);
  }

  /** Lấy danh sách thành viên + shared content (media/links/docs) của room. */
  async function getRoomMembers(
    workspaceId: number,
    roomId: number,
  ): Promise<RoomMembersResult> {
    const res = await api.get(
      buildPath(workspaceId, `/rooms/${roomId}/members`),
    );
    return unwrap(res);
  }

  /** Thêm 1 thành viên vào group (chỉ trưởng nhóm). */
  async function addMember(
    workspaceId: number,
    roomId: number,
    targetUserId: number,
  ): Promise<void> {
    await api.post(
      buildPath(workspaceId, `/rooms/${roomId}/members/${targetUserId}`),
    );
  }

  /** Thêm nhiều thành viên cùng lúc (gọi tuần tự). */
  async function addMembers(
    workspaceId: number,
    roomId: number,
    userIds: number[],
  ): Promise<void> {
    for (const userId of userIds) {
      await addMember(workspaceId, roomId, userId);
    }
  }

  /** Xóa 1 thành viên khỏi group (chỉ trưởng nhóm). */
  async function removeMember(
    workspaceId: number,
    roomId: number,
    targetUserId: number,
  ): Promise<void> {
    await api.delete(
      buildPath(workspaceId, `/rooms/${roomId}/members/${targetUserId}`),
    );
  }

  /** Member tự rời group (không áp dụng cho trưởng nhóm). */
  async function leaveRoom(workspaceId: number, roomId: number): Promise<void> {
    await api.post(buildPath(workspaceId, `/rooms/${roomId}/leave`));
  }

  /** Xóa group (chỉ trưởng nhóm, chỉ GROUP). */
  async function deleteRoom(
    workspaceId: number,
    roomId: number,
  ): Promise<void> {
    await api.delete(buildPath(workspaceId, `/rooms/${roomId}`));
  }

  /** Lấy danh sách thành viên đã xem room, kèm thời điểm đọc cuối. */
  async function getReadReceipts(
    workspaceId: number,
    roomId: number,
  ): Promise<ReadReceipt[]> {
    const res = await api.get(
      buildPath(workspaceId, `/rooms/${roomId}/read-receipts`),
    );
    return unwrap(res);
  }

  return {
    // Rooms
    getRooms,
    searchRooms,
    openDirect,
    createGroup,
    // Messages
    getMessages,
    searchMessages,
    markRead,
    editMessage,
    recallMessage,
    // Pin / Mute
    togglePin,
    toggleMute,
    // Read receipts
    getReadReceipts,
    // Group management
    renameGroup,
    updateGroupAvatar,
    getRoomMembers,
    addMember,
    addMembers,
    removeMember,
    leaveRoom,
    deleteRoom,
  };
};
