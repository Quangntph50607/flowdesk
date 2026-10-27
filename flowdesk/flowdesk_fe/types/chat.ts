// ========================
// Chat Types
// ========================

export interface ChatRoom {
  id: number;
  type: "DIRECT" | "GROUP";
  name: string;
  avatarInitial: string;
  avatarUrl?: string | null;
  description?: string | null;
  lastMessage: string | null;
  lastMessageSenderName?: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isOwner: boolean;
  isMuted: boolean;
  isPinned: boolean;
  muted?: boolean;
  owner?: boolean;
  pinned?: boolean;
  memberCount?: number;
}

/** Trạng thái đang nhập của 1 user trong 1 room. */
export interface TypingState {
  roomId: number;
  userEmail: string;
  userName: string;
  typing: boolean;
}

/** Thông tin ai đã xem. */
export interface ReadReceipt {
  userId: number;
  fullName: string;
  avatarInitial: string;
  avatarUrl?: string | null;
  lastReadAt: string;
}

/** Các loại WS event từ BE (ngoài ChatMessage thông thường). */
export type WsEventType =
  | "TYPING"
  | "READ_RECEIPT"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_LEFT"
  | "ROOM_RENAMED"
  | "AVATAR_UPDATED"
  | "ROOM_DELETED";

export interface WsEvent {
  eventType: WsEventType;
  roomId: number;
  [key: string]: any;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  senderAvatarInitial: string;
  senderAvatarUrl?: string | null;
  type: "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO" | "SYSTEM";
  content: string | null;
  isRecalled: boolean;
  isEdited: boolean;
  replyTo?: ChatReplyPreview | null;
  /** Tên file gốc (khi type = IMAGE/FILE/VIDEO/AUDIO) */
  fileName?: string | null;
  /** Kích thước file (bytes) */
  fileSize?: number | null;
  createdAt: string;
}

export interface ChatReplyPreview {
  id: number;
  senderId: number;
  senderName: string;
  type: ChatMessage["type"];
  content: string | null;
  isRecalled: boolean;
}

export interface ChatLinkItem {
  messageId: number;
  url: string;
  createdAt: string;
}

export interface WorkspaceMember {
  userId: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  roleCode: string;
  branchLabels?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  number: number;
}
