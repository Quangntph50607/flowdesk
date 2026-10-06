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
  lastMessageAt: string | null;
  unreadCount: number;
  isOwner: boolean;
  owner?: boolean;
  memberCount?: number;
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
