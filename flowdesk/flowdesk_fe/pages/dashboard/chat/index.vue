<template>
  <div class="chat-page-root">
    <!-- ── LOADING ─────────────────────────────────────────────── -->
    <div
      v-if="loading"
      class="flex items-center justify-center"
      style="height: calc(100vh - 24px); color: #94a3b8"
    >
      <ProgressSpinner style="width: 32px; height: 32px" />
    </div>

    <!-- ── MAIN CHAT ────────────────────────────────────────────── -->
    <div
      v-else-if="resolvedWorkspaceId"
      class="flex overflow-hidden"
      style="height: calc(100vh - 24px)"
    >
      <!-- LEFT: Conversation list -->
      <div
        class="shrink-0 border-r"
        style="width: 300px; border-color: #f1f5f9"
      >
        <!-- Workspace switcher header (chỉ hiện nếu có > 1 workspace) -->
        <div
          v-if="availableWorkspaces.length > 1"
          class="flex cursor-pointer items-center gap-2 border-b border-slate-100 bg-white px-3 py-2.5 hover:bg-slate-100"
          style="border-bottom: 1px solid #f1f5f9; background: #fff"
          aria-haspopup="true"
          aria-controls="ws_switch_menu"
          @click="toggleWsSwitchMenu"
        >
          <div
            class="flex items-center justify-center rounded-lg shrink-0 font-bold text-xs"
            style="width: 26px; height: 26px; background: #0f172a; color: #fff"
          >
            {{ activeWorkspaceName?.charAt(0).toUpperCase() }}
          </div>
          <span
            class="text-xs font-medium truncate flex-1"
            style="color: #0f172a"
          >
            {{ activeWorkspaceName }}
          </span>
          <i
            class="pi pi-chevron-down"
            style="color: #94a3b8; font-size: 10px; transition: transform 0.2s"
          />
        </div>

        <!-- Workspace switch dropdown -->
        <Menu
          ref="wsSwitchMenu"
          id="ws_switch_menu"
          :model="wsSwitchMenuItems"
          :popup="true"
          style="min-width: 250px"
        >
          <template #item="{ item }">
            <div
              class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100"
              :class="{ 'bg-slate-50': item.active }"
              @click="item.command"
            >
              <div
                class="flex items-center justify-center rounded-lg shrink-0 font-bold text-xs"
                style="
                  width: 30px;
                  height: 30px;
                  background: #0f172a;
                  color: #fff;
                "
              >
                {{ item.label?.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate" style="color: #0f172a">
                  {{ item.label }}
                </p>
                <p class="text-xs" style="color: #94a3b8">
                  {{ item.roleCode }}
                </p>
              </div>
              <i
                v-if="item.active"
                class="pi pi-check"
                style="color: #0f172a; font-size: 11px"
              />
            </div>
          </template>
        </Menu>

        <ChatRoomList
          :rooms="chatStore.rooms"
          :searching="searchingRooms"
          @select-room="openRoom"
          @open-new-direct="showNewDirect = true"
          @open-create-group="showCreateGroup = true"
          @toggle-pin="handleTogglePin"
          @toggle-mute="handleToggleMute"
          @search="handleSearchRooms"
        />
      </div>

      <!-- RIGHT: Chat window + inline info panel -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Chat window -->
        <div class="flex-1 overflow-hidden">
          <div
            v-if="!chatStore.activeRoomId"
            class="flex flex-col items-center justify-center h-full gap-2"
            style="background: #f8fafc; color: #94a3b8"
          >
            <div
              style="
                width: 64px;
                height: 64px;
                border-radius: 50%;
                background: #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <i
                class="pi pi-comments"
                style="font-size: 28px; color: #94a3b8"
              />
            </div>
            <p class="text-sm font-semibold mt-2" style="color: #475569">
              Chọn một cuộc trò chuyện
            </p>
            <p class="text-xs" style="color: #94a3b8">
              hoặc bắt đầu cuộc trò chuyện mới
            </p>
          </div>

          <ChatWindow
            v-else-if="chatStore.activeRoom"
            ref="chatWindowRef"
            :room="chatStore.activeRoom"
            :messages="activeRoomMessages"
            :current-user-id="currentUserId"
            :loading-more="loadingMore"
            :info-open="showGroupInfo"
            :search-results="messageSearchResults"
            :searching-messages="searchingMessages"
            :typing-users="activeTypingUsers"
            :read-receipts="activeReadReceipts"
            :is-online="activeDirectOnline"
            @send="handleSend"
            @send-file="handleSendFile"
            @edit-message="handleEditMessage"
            @recall-message="handleRecallMessage"
            @load-more="handleLoadMore"
            @toggle-info="handleToggleInfo"
            @search-messages="handleSearchMessages"
            @jump-to-search-result="handleJumpToSearchResult"
            @typing="handleTyping"
          />
        </div>

        <!-- Inline info panel -->
        <Transition
          enter-active-class="overflow-hidden transition-all duration-200 ease-in"
          leave-active-class="overflow-hidden transition-all duration-200 ease-in"
          enter-from-class="w-0 opacity-0"
          leave-to-class="w-0 opacity-0"
          enter-to-class="w-[260px] opacity-100"
          leave-from-class="w-[260px] opacity-100"
        >
          <ChatGroupInfoPanel
            v-if="showGroupInfo && chatStore.activeRoom"
            :room="chatStore.activeRoom"
            :members="groupMembers"
            :member-count="groupMemberCount"
            :shared-media="groupSharedMedia"
            :shared-links="groupSharedLinks"
            :shared-docs="groupSharedDocs"
            :current-user-id="currentUserId"
            :leaving="leavingRoom"
            :updating-avatar="updatingGroupAvatar"
            @rename="handleRenameGroup"
            @remove-member="handleRemoveMember"
            @open-add-member="openAddMemberDialog"
            @update-avatar="handleUpdateGroupAvatar"
            @leave-room="handleLeaveRoom"
            @delete-room="handleDeleteRoom"
            @toggle-mute="handleToggleMute"
          />
        </Transition>
      </div>
    </div>

    <!-- ── DIALOGS ──────────────────────────────────────────────── -->
    <ChatNewDirectDialog
      :visible="showNewDirect"
      :members="workspaceMembers"
      :current-user-id="currentUserId"
      @update:visible="showNewDirect = $event"
      @select="startDirect"
    />

    <ChatCreateGroupDialog
      :visible="showCreateGroup"
      :members="workspaceMembers"
      :current-user-id="currentUserId"
      :loading="creatingGroup"
      @update:visible="showCreateGroup = $event"
      @create="handleCreateGroup"
    />

    <ChatAddMemberDialog
      :visible="showAddMember"
      :available-members="membersNotInGroup"
      :loading="addingMember"
      @update:visible="showAddMember = $event"
      @add="handleAddMembers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import Menu from "primevue/menu";
import { useAuthStore } from "../../../stores/auth";
import { useChatStore } from "../../../stores/chat";
import type {
  ChatLinkItem,
  ChatMessage,
  WorkspaceMember,
  TypingState,
  ReadReceipt,
  WsEvent,
} from "../../../types/chat";

// Type cho ref của ChatWindow
interface ChatWindowExposed {
  scrollToBottom: (smooth?: boolean) => void;
  scrollToMessage: (messageId: number) => void;
  preserveScrollAfterPrepend: (prevHeight: number) => void;
  getScrollHeight: () => number;
}

definePageMeta({ middleware: "auth", layout: "default" });

const api = useApi();
const chatApi = useChatApi();
const authStore = useAuthStore();
const chatStore = useChatStore();
const toast = useAppToast();
const confirm = useAppConfirm();
const {
  connect,
  disconnect,
  subscribeRoom,
  sendWsMessage,
  sendWsFile,
  sendWsTyping,
  subscribePresence,
  sendHeartbeat,
  isConnected,
} = useChat();
const { uploadAvatar } = useFileUpload();

// ── Workspace state ───────────────────────────────────────────────
const loading = ref(true);
const resolvedWorkspaceId = ref<number | null>(null);

interface WorkspaceOption {
  workspaceId: number;
  workspaceName: string;
  roleCode: string;
}
const availableWorkspaces = ref<WorkspaceOption[]>([]);

const activeWorkspaceName = computed(
  () =>
    availableWorkspaces.value.find(
      (w) => w.workspaceId === resolvedWorkspaceId.value,
    )?.workspaceName ?? "",
);

// Workspace switch dropdown
const wsSwitchMenu = ref();

function toggleWsSwitchMenu(event: Event) {
  wsSwitchMenu.value?.toggle(event);
}

const wsSwitchMenuItems = computed(() =>
  availableWorkspaces.value.map((ws) => ({
    label: ws.workspaceName,
    roleCode: ws.roleCode,
    active: ws.workspaceId === resolvedWorkspaceId.value,
    command: () => {
      if (ws.workspaceId !== resolvedWorkspaceId.value) {
        enterWorkspace(ws.workspaceId);
      }
    },
  })),
);

async function resolveWorkspace() {
  if (!authStore.currentUser) await authStore.fetchMe();

  if (authStore.isSuperAdmin) {
    // SUPERADMIN: lấy từ API
    try {
      const res = await api.get("/api/admin/workspaces", {
        params: { limit: 20, page: 1 },
      });
      availableWorkspaces.value = getPageItems(res.data.data).map((w: any) => ({
        workspaceId: w.id,
        workspaceName: w.name,
        roleCode: "SUPER_ADMIN",
      }));
    } catch {
      /* ignore */
    }
  } else {
    // Lấy tất cả workspace của user (cả workspace cha lẫn workspace con)
    availableWorkspaces.value = (authStore.currentUser?.workspaces ?? []).map(
      (w) => ({
        workspaceId: w.workspaceId,
        workspaceName: w.workspaceName,
        roleCode: w.roleCode,
      }),
    );
  }

  if (availableWorkspaces.value.length === 0) {
    // Không có workspace nào
    loading.value = false;
    return;
  }

  // Luôn tự động vào workspace đầu tiên (dropdown header để switch sau)
  await enterWorkspace(availableWorkspaces.value[0].workspaceId);
}

async function enterWorkspace(workspaceId: number) {
  loading.value = true;

  // Reset nếu đổi workspace
  if (resolvedWorkspaceId.value !== workspaceId) {
    chatStore.reset();
    disconnect();
  }

  resolvedWorkspaceId.value = workspaceId;

  await Promise.all([loadRooms(), loadWorkspaceMembers()]);

  connect(() => {
    chatStore.rooms.forEach((r: any) => subscribeRoom(r.id, onRealtimeMessage));
    subscribePresence(onPresenceEvent);
    sendHeartbeat();
  });

  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(sendHeartbeat, 20000);
  loading.value = false;
}

// ── Computed ──────────────────────────────────────────────────────
const currentUserId = computed(() => authStore.currentUser?.id ?? 0);

const activeRoomMessages = computed(() => {
  if (!chatStore.activeRoomId) return [];
  return chatStore.roomMessages(chatStore.activeRoomId);
});

const onlineEmails = ref<Set<string>>(new Set());
const activeDirectOnline = computed(() => {
  if (chatStore.activeRoom?.type !== "DIRECT") return false;
  const other = groupMembers.value.find((m) => m.userId !== currentUserId.value);
  return !!other?.email && onlineEmails.value.has(other.email);
});

/** Danh sách người đang nhập trong room hiện tại (không phải mình). */
const activeTypingUsers = computed(() => {
  if (!chatStore.activeRoomId) return [];
  return typingStates.value.get(chatStore.activeRoomId) ?? [];
});

/** Read receipts của room hiện tại. */
const activeReadReceipts = computed(() => {
  if (!chatStore.activeRoomId) return [];
  return readReceipts.value.get(chatStore.activeRoomId) ?? [];
});

const membersNotInGroup = computed<WorkspaceMember[]>(() => {
  const inGroup = new Set(groupMembers.value.map((m) => m.userId));
  return workspaceMembers.value.filter((m) => !inGroup.has(m.userId));
});

// ── Refs ──────────────────────────────────────────────────────────
const chatWindowRef = ref<ChatWindowExposed | null>(null);
const loadingMore = ref(false);
const creatingGroup = ref(false);
const leavingRoom = ref(false);
const addingMember = ref(false);
const updatingGroupAvatar = ref(false);

const showNewDirect = ref(false);
const showCreateGroup = ref(false);
const showGroupInfo = ref(false);
const showAddMember = ref(false);

// ── Search state ──────────────────────────────────────────────────
const searchingRooms = ref(false);
const searchingMessages = ref(false);
const messageSearchResults = ref<ChatMessage[]>([]);

// ── Typing state ──────────────────────────────────────────────────
// Map roomId → danh sách user đang nhập
const typingStates = ref<Map<number, TypingState[]>>(new Map());
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

// ── Read receipts ─────────────────────────────────────────────────
// Map roomId → danh sách read receipts
const readReceipts = ref<Map<number, ReadReceipt[]>>(new Map());

const workspaceMembers = ref<WorkspaceMember[]>([]);
const groupMembers = ref<
  {
    userId: number;
    fullName: string;
    email?: string | null;
    avatarInitial?: string | null;
    avatarUrl?: string | null;
    isOwner: boolean;
  }[]
>([]);
const groupMemberCount = ref(0);
const groupSharedMedia = ref<ChatMessage[]>([]);
const groupSharedLinks = ref<ChatLinkItem[]>([]);
const groupSharedDocs = ref<ChatMessage[]>([]);

// ── Helpers ───────────────────────────────────────────────────────
function wsId(): number {
  return resolvedWorkspaceId.value!;
}

// ── Data loading ──────────────────────────────────────────────────
async function loadRooms() {
  try {
    const rooms = await chatApi.getRooms(wsId(), { limit: 20, page: 1 });
    chatStore.setRooms(rooms);
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không tải được danh sách chat",
      life: 3000,
    });
  }
}

async function loadWorkspaceMembers() {
  try {
    const res = await api.get(`/api/workspaces/${wsId()}/all-members`, {
      params: { limit: 200, page: 1 },
    });
    workspaceMembers.value = getPageItems(res.data.data).map((m: any) => ({
      userId: m.userId,
      fullName: m.fullName,
      email: m.email,
      avatarUrl: m.avatarUrl,
      roleCode: m.roleCode,
    }));
  } catch {
    /* non-critical */
  }
}

async function loadMessages(roomId: number, page: number, isFirst: boolean) {
  try {
    if (!isFirst) loadingMore.value = true;
    const pageData = await chatApi.getMessages(wsId(), roomId, page, 30);
    chatStore.setMessages(roomId, pageData.content ?? [], isFirst);
    chatStore.setHasMore(roomId, !pageData.last);
    chatStore.setCurrentPage(roomId, page);
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không tải được tin nhắn",
      life: 3000,
    });
  } finally {
    loadingMore.value = false;
  }
}

async function loadGroupMembers(roomId: number) {
  try {
    const payload = await chatApi.getRoomMembers(wsId(), roomId);
    groupMembers.value = payload.members ?? [];
    groupMemberCount.value = payload.total ?? 0;
    groupSharedMedia.value = payload.media ?? [];
    groupSharedLinks.value = payload.links ?? [];
    groupSharedDocs.value = payload.docs ?? [];
    if (chatStore.activeRoom?.id === roomId) {
      chatStore.updateRoom({
        ...chatStore.activeRoom,
        memberCount: groupMemberCount.value,
      });
    }
  } catch {
    /* ignore */
  }
}

// ── Room actions ──────────────────────────────────────────────────
async function openRoom(roomId: number) {
  // Đóng info panel khi đổi room
  if (chatStore.activeRoomId !== roomId) showGroupInfo.value = false;

  chatStore.setActiveRoom(roomId);
  chatStore.clearUnread(roomId);

  if (isConnected()) subscribeRoom(roomId, onRealtimeMessage);

  if (!chatStore.messages[roomId]) await loadMessages(roomId, 0, true);

  await loadGroupMembers(roomId);
  await loadReadReceipts(roomId);

  try {
    await chatApi.markRead(wsId(), roomId);
  } catch {
    /* ignore */
  }

  await nextTick();
  chatWindowRef.value?.scrollToBottom();
}

async function handleTogglePin(roomId: number) {
  try {
    const updated = await chatApi.togglePin(wsId(), roomId);
    chatStore.updateRoom(updated);
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể ghim cuộc trò chuyện",
      life: 3000,
    });
  }
}

async function handleToggleMute(roomId: number) {
  try {
    const updated = await chatApi.toggleMute(wsId(), roomId);
    chatStore.updateRoom(updated);
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể cập nhật thông báo",
      life: 3000,
    });
  }
}

async function handleLoadMore() {
  const roomId = chatStore.activeRoomId;
  if (!roomId || loadingMore.value || !chatStore.hasMore[roomId]) return;
  const page = (chatStore.currentPage[roomId] ?? 0) + 1;
  const prevHeight = chatWindowRef.value?.getScrollHeight() ?? 0;
  await loadMessages(roomId, page, false);
  await nextTick();
  chatWindowRef.value?.preserveScrollAfterPrepend(prevHeight);
}

function handleSend(content: string, replyToMessageId?: number | null) {
  if (!chatStore.activeRoomId) return;
  sendWsMessage(chatStore.activeRoomId, content, replyToMessageId);
}

function handleTyping(typing: boolean) {
  if (!chatStore.activeRoomId || !authStore.currentUser) return;
  sendWsTyping(
    chatStore.activeRoomId,
    authStore.currentUser.fullName ?? authStore.currentUser.email,
    typing,
  );
}

function handleSendFile(
  fileUrl: string,
  fileType: "IMAGE" | "FILE" | "VIDEO" | "AUDIO",
  fileName: string,
  fileSize: number,
  replyToMessageId?: number | null,
) {
  if (!chatStore.activeRoomId) return;
  sendWsFile(
    chatStore.activeRoomId,
    fileUrl,
    fileType,
    fileName,
    fileSize,
    replyToMessageId,
  );
}

async function handleEditMessage(messageId: number, content: string) {
  const roomId = chatStore.activeRoomId;
  if (!roomId) return;
  try {
    const updated = await chatApi.editMessage(
      wsId(),
      roomId,
      messageId,
      content,
    );
    chatStore.updateMessage(updated);
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể sửa tin nhắn",
      life: 3000,
    });
  }
}

async function handleRecallMessage(messageId: number) {
  const roomId = chatStore.activeRoomId;
  if (!roomId) return;
  try {
    const updated = await chatApi.recallMessage(wsId(), roomId, messageId);
    chatStore.updateMessage(updated);
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể thu hồi tin nhắn",
      life: 3000,
    });
  }
}

async function handleToggleInfo() {
  const roomId = chatStore.activeRoomId;
  showGroupInfo.value = !showGroupInfo.value;
  if (showGroupInfo.value && roomId) {
    await loadGroupMembers(roomId);
  }
}

async function loadReadReceipts(roomId: number) {
  try {
    const receipts = await chatApi.getReadReceipts(wsId(), roomId);
    readReceipts.value = new Map(readReceipts.value).set(roomId, receipts);
  } catch {
    /* non-critical */
  }
}

function handleTypingEvent(event: WsEvent) {
  const roomId = event.roomId as number;
  const userEmail = event.userEmail as string;
  const userName = event.userName as string;
  const typing = event.typing as boolean;

  const key = `${roomId}-${userEmail}`;

  // Clear timer cũ
  if (typingTimers.has(key)) {
    clearTimeout(typingTimers.get(key)!);
    typingTimers.delete(key);
  }

  const current = typingStates.value.get(roomId) ?? [];

  if (typing) {
    const updated = [
      ...current.filter((t) => t.userEmail !== userEmail),
      { roomId, userEmail, userName, typing: true },
    ];
    typingStates.value = new Map(typingStates.value).set(roomId, updated);

    // Tự xóa sau 4s nếu không có update mới
    const timer = setTimeout(() => {
      const list = typingStates.value.get(roomId) ?? [];
      typingStates.value = new Map(typingStates.value).set(
        roomId,
        list.filter((t) => t.userEmail !== userEmail),
      );
      typingTimers.delete(key);
    }, 4000);
    typingTimers.set(key, timer);
  } else {
    typingStates.value = new Map(typingStates.value).set(
      roomId,
      current.filter((t) => t.userEmail !== userEmail),
    );
  }
}

function onPresenceEvent(event: any) {
  if (event?.eventType !== "PRESENCE" || !event.email) return;
  const next = new Set(onlineEmails.value);
  if (event.online) next.add(event.email);
  else next.delete(event.email);
  onlineEmails.value = next;
}

function onRealtimeMessage(msg: any) {
  // Phân loại event — có eventType thì là system event, không có là ChatMessage
  if (msg.eventType) {
    const event = msg as WsEvent;
    switch (event.eventType) {
      case "TYPING":
        // Không hiện typing của chính mình
        if (event.userEmail !== authStore.currentUser?.email) {
          handleTypingEvent(event);
        }
        break;

      case "READ_RECEIPT":
        if (event.receipts) {
          readReceipts.value = new Map(readReceipts.value).set(
            event.roomId,
            event.receipts as ReadReceipt[],
          );
        }
        break;

      case "MEMBER_ADDED":
      case "MEMBER_REMOVED":
      case "MEMBER_LEFT":
        if (event.eventType === "MEMBER_REMOVED" && event.targetUserId === currentUserId.value) {
          chatStore.removeRoom(event.roomId);
          if (chatStore.activeRoomId === event.roomId) chatStore.setActiveRoom(null);
        }
        // Reload member list nếu đang mở panel
        if (showGroupInfo.value && chatStore.activeRoomId === event.roomId) {
          loadGroupMembers(event.roomId);
        }
        // Reload rooms để cập nhật sidebar
        loadRooms();
        break;

      case "ROOM_RENAMED":
        {
          const room = chatStore.rooms.find((r) => r.id === event.roomId);
          if (room) chatStore.updateRoom({ ...room, name: event.name });
        }
        break;

      case "AVATAR_UPDATED":
        loadRooms();
        break;

      case "ROOM_DELETED":
        chatStore.removeRoom(event.roomId);
        if (chatStore.activeRoomId === event.roomId) {
          showGroupInfo.value = false;
        }
        break;
    }
    return;
  }

  // Normal message
  chatStore.appendMessage(msg);
  if (msg.roomId === chatStore.activeRoomId) {
    nextTick(() => chatWindowRef.value?.scrollToBottom(true));
  }
}

// ── Search ────────────────────────────────────────────────────────
async function handleSearchRooms(keyword: string) {
  if (!keyword) {
    // Clear search → tải lại danh sách đầy đủ
    await loadRooms();
    return;
  }
  searchingRooms.value = true;
  try {
    const results = await chatApi.searchRooms(wsId(), keyword);
    chatStore.setRooms(results);
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không tìm được cuộc trò chuyện",
      life: 3000,
    });
  } finally {
    searchingRooms.value = false;
  }
}

async function handleSearchMessages(keyword: string) {
  const roomId = chatStore.activeRoomId;
  if (!roomId || !keyword) {
    messageSearchResults.value = [];
    return;
  }
  searchingMessages.value = true;
  try {
    const page = await chatApi.searchMessages(wsId(), roomId, keyword, 0, 20);
    messageSearchResults.value = page.content ?? [];
  } catch {
    messageSearchResults.value = [];
  } finally {
    searchingMessages.value = false;
  }
}

async function handleJumpToSearchResult(messageId: number) {
  const roomId = chatStore.activeRoomId;
  if (!roomId) return;

  // Nếu message đã có trong store, scroll ngay (đợi nextTick cho DOM)
  const alreadyLoaded = chatStore
    .roomMessages(roomId)
    .find((m) => m.id === messageId);
  if (alreadyLoaded) {
    await nextTick();
    chatWindowRef.value?.scrollToMessage?.(messageId);
    return;
  }

  // Load thêm các page cũ hơn cho tới khi tìm thấy hoặc hết
  toast.add({
    severity: "info",
    summary: "Đang tải tin nhắn...",
    life: 1500,
  });

  let page = chatStore.currentPage[roomId] ?? 0;
  while (chatStore.hasMore[roomId]) {
    page += 1;
    await loadMessages(roomId, page, false);
    if (chatStore.roomMessages(roomId).find((m) => m.id === messageId)) {
      await nextTick();
      chatWindowRef.value?.scrollToMessage?.(messageId);
      return;
    }
  }

  toast.add({
    severity: "warn",
    summary: "Không tìm thấy",
    detail: "Tin nhắn có thể đã bị xóa.",
    life: 2500,
  });
}

// ── Direct chat ───────────────────────────────────────────────────
async function startDirect(targetUserId: number) {
  try {
    const room = await chatApi.openDirect(wsId(), targetUserId);
    if (!chatStore.rooms.find((r: any) => r.id === room.id))
      chatStore.prependRoom(room);
    await openRoom(room.id);
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể mở chat",
      life: 3000,
    });
  }
}

// ── Create group ──────────────────────────────────────────────────
async function handleCreateGroup(payload: {
  name: string;
  avatarUrl?: string | null;
  memberIds: number[];
}) {
  creatingGroup.value = true;
  try {
    const room = await chatApi.createGroup(wsId(), payload);
    chatStore.prependRoom(room);
    showCreateGroup.value = false;
    await openRoom(room.id);
    toast.add({
      severity: "success",
      summary: "Đã tạo nhóm",
      detail: room.name,
      life: 3000,
    });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể tạo nhóm",
      life: 3000,
    });
  } finally {
    creatingGroup.value = false;
  }
}

// ── Group management ──────────────────────────────────────────────
async function handleRenameGroup(newName: string) {
  if (!chatStore.activeRoomId) return;
  try {
    const updated = await chatApi.renameGroup(
      wsId(),
      chatStore.activeRoomId,
      newName,
    );
    chatStore.updateRoom(updated);
    toast.add({ severity: "success", summary: "Đã đổi tên nhóm", life: 2000 });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể đổi tên",
      life: 3000,
    });
  }
}

async function handleUpdateGroupAvatar(file: File) {
  if (!chatStore.activeRoomId) return;
  updatingGroupAvatar.value = true;
  try {
    const uploaded = await uploadAvatar(file);
    if (!uploaded?.fileUrl) {
      throw new Error("Upload failed");
    }
    const updated = await chatApi.updateGroupAvatar(
      wsId(),
      chatStore.activeRoomId,
      uploaded.fileUrl,
    );
    chatStore.updateRoom(updated);
    toast.add({
      severity: "success",
      summary: "Đã cập nhật ảnh nhóm",
      life: 2000,
    });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể cập nhật ảnh nhóm",
      life: 3000,
    });
  } finally {
    updatingGroupAvatar.value = false;
  }
}

async function openAddMemberDialog() {
  const roomId = chatStore.activeRoomId;
  if (!roomId) return;
  addingMember.value = true;
  try {
    await Promise.all([loadWorkspaceMembers(), loadGroupMembers(roomId)]);
    showAddMember.value = true;
  } finally {
    addingMember.value = false;
  }
}

async function handleAddMembers(userIds: number[]) {
  if (!chatStore.activeRoomId) return;
  addingMember.value = true;
  try {
    await chatApi.addMembers(wsId(), chatStore.activeRoomId, userIds);
    showAddMember.value = false;
    await Promise.all([
      loadWorkspaceMembers(),
      loadGroupMembers(chatStore.activeRoomId),
    ]);
    toast.add({
      severity: "success",
      summary: "Đã thêm thành viên",
      life: 2000,
    });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e.response?.data?.message ?? "Không thể thêm thành viên",
      life: 3000,
    });
  } finally {
    addingMember.value = false;
  }
}

async function handleRemoveMember(targetUserId: number) {
  if (!chatStore.activeRoomId) return;
  const member = groupMembers.value.find((m) => m.userId === targetUserId);
  const snap = chatStore.activeRoomId;
  confirm.require({
    message: `Xóa "${member?.fullName}" khỏi nhóm?`,
    header: "Xác nhận",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Xóa",
    rejectLabel: "Hủy",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await chatApi.removeMember(wsId(), snap, targetUserId);
        await loadGroupMembers(snap);
        toast.add({
          severity: "success",
          summary: "Đã xóa thành viên",
          life: 2000,
        });
      } catch (e: any) {
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: e.response?.data?.message ?? "Không thể xóa",
          life: 3000,
        });
      }
    },
  });
}

async function handleLeaveRoom() {
  if (!chatStore.activeRoomId) return;
  const snap = chatStore.activeRoomId;
  confirm.require({
    message: "Bạn có chắc muốn rời nhóm này?",
    header: "Rời nhóm",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Rời",
    rejectLabel: "Hủy",
    acceptProps: { severity: "danger" },
    accept: async () => {
      leavingRoom.value = true;
      try {
        await chatApi.leaveRoom(wsId(), snap);
        showGroupInfo.value = false;
        chatStore.removeRoom(snap);
        toast.add({ severity: "info", summary: "Đã rời nhóm", life: 2000 });
      } catch (e: any) {
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: e.response?.data?.message ?? "Không thể rời nhóm",
          life: 3000,
        });
      } finally {
        leavingRoom.value = false;
      }
    },
  });
}

async function handleDeleteRoom() {
  if (!chatStore.activeRoomId) return;
  const snap = chatStore.activeRoomId;
  const roomName = chatStore.activeRoom?.name;
  confirm.require({
    message: `Xóa nhóm "${roomName}"? Hành động này không thể hoàn tác.`,
    header: "Xóa nhóm",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "Xóa",
    rejectLabel: "Hủy",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await chatApi.deleteRoom(wsId(), snap);
        showGroupInfo.value = false;
        chatStore.removeRoom(snap);
        toast.add({ severity: "success", summary: "Đã xóa nhóm", life: 2000 });
      } catch (e: any) {
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: e.response?.data?.message ?? "Không thể xóa nhóm",
          life: 3000,
        });
      }
    },
  });
}

// ── Lifecycle ─────────────────────────────────────────────────────
onMounted(async () => {
  await resolveWorkspace();
});

onUnmounted(() => {
  disconnect();
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  chatStore.setActiveRoom(null);
  // Cleanup typing timers
  typingTimers.forEach((t) => clearTimeout(t));
  typingTimers.clear();
});
</script>
