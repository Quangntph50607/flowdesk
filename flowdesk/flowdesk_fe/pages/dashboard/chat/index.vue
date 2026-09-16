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
          class="flex items-center gap-2 px-3 py-2.5 cursor-pointer ws-switcher-header"
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
          style="min-width: 220px"
        >
          <template #item="{ item }">
            <div
              class="flex items-center gap-3 px-3 py-2 cursor-pointer ws-switch-item"
              :class="{ 'ws-switch-item--active': item.active }"
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
          @select-room="openRoom"
          @open-new-direct="showNewDirect = true"
          @open-create-group="showCreateGroup = true"
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
            @send="handleSend"
            @send-file="handleSendFile"
            @load-more="handleLoadMore"
            @toggle-info="showGroupInfo = !showGroupInfo"
          />
        </div>

        <!-- Inline info panel (GROUP only) -->
        <Transition name="slide-info">
          <ChatGroupInfoPanel
            v-if="
              showGroupInfo &&
              chatStore.activeRoom?.type === 'GROUP' &&
              chatStore.activeRoom
            "
            :room="chatStore.activeRoom"
            :members="groupMembers"
            :member-count="groupMemberCount"
            :shared-media="groupSharedMedia"
            :shared-links="groupSharedLinks"
            :shared-docs="groupSharedDocs"
            :current-user-id="currentUserId"
            :leaving="leavingRoom"
            @rename="handleRenameGroup"
            @remove-member="handleRemoveMember"
            @open-add-member="showAddMember = true"
            @leave-room="handleLeaveRoom"
            @delete-room="handleDeleteRoom"
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

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import Menu from "primevue/menu";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useAuthStore } from "../../../stores/auth";
import { useChatStore } from "../../../stores/chat";
import type { ChatLinkItem, ChatMessage, WorkspaceMember } from "../../../types/chat";

// Type cho ref của ChatWindow
interface ChatWindowExposed {
  scrollToBottom: (smooth?: boolean) => void;
  preserveScrollAfterPrepend: (prevHeight: number) => void;
  getScrollHeight: () => number;
}

definePageMeta({ middleware: "auth", layout: "default" });

const api = useApi();
const authStore = useAuthStore();
const chatStore = useChatStore();
const toast = useToast();
const confirm = useConfirm();
const {
  connect,
  disconnect,
  subscribeRoom,
  sendWsMessage,
  sendWsFile,
  isConnected,
} = useChat();

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
      const res = await api.get("/api/admin/workspaces");
      availableWorkspaces.value = (res.data.data ?? []).map((w: any) => ({
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
  });

  loading.value = false;
}

// ── Computed ──────────────────────────────────────────────────────
const currentUserId = computed(() => authStore.currentUser?.id ?? 0);

const activeRoomMessages = computed(() => {
  if (!chatStore.activeRoomId) return [];
  return chatStore.roomMessages(chatStore.activeRoomId);
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

const showNewDirect = ref(false);
const showCreateGroup = ref(false);
const showGroupInfo = ref(false);
const showAddMember = ref(false);

const workspaceMembers = ref<WorkspaceMember[]>([]);
const groupMembers = ref<
  { userId: number; fullName: string; isOwner: boolean }[]
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
    const res = await api.get(`/api/workspaces/${wsId()}/chat/rooms`);
    chatStore.setRooms(res.data.data ?? []);
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
    const res = await api.get(`/api/workspaces/${wsId()}/all-members`);
    workspaceMembers.value = (res.data.data ?? []).map((m: any) => ({
      userId: m.userId,
      fullName: m.fullName,
      email: m.email,
      roleCode: m.roleCode,
    }));
  } catch {
    /* non-critical */
  }
}

async function loadMessages(roomId: number, page: number, isFirst: boolean) {
  try {
    if (!isFirst) loadingMore.value = true;
    const res = await api.get(
      `/api/workspaces/${wsId()}/chat/rooms/${roomId}/messages`,
      { params: { page, size: 30 } },
    );
    const pageData = res.data.data;
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
    const res = await api.get(
      `/api/workspaces/${wsId()}/chat/rooms/${roomId}/members`,
    );
    const payload = res.data.data ?? {};
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

  if (chatStore.activeRoom?.type === "GROUP") await loadGroupMembers(roomId);

  try {
    await api.post(`/api/workspaces/${wsId()}/chat/rooms/${roomId}/read`);
  } catch {
    /* ignore */
  }

  await nextTick();
  chatWindowRef.value?.scrollToBottom();
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

function handleSend(content: string) {
  if (!chatStore.activeRoomId) return;
  sendWsMessage(chatStore.activeRoomId, content);
}

function handleSendFile(
  fileUrl: string,
  fileType: "IMAGE" | "FILE" | "VIDEO" | "AUDIO",
  fileName: string,
  fileSize: number,
) {
  if (!chatStore.activeRoomId) return;
  sendWsFile(chatStore.activeRoomId, fileUrl, fileType, fileName, fileSize);
}

function onRealtimeMessage(msg: any) {
  chatStore.appendMessage(msg);
  if (msg.roomId === chatStore.activeRoomId) {
    nextTick(() => chatWindowRef.value?.scrollToBottom(true));
  }
}

// ── Direct chat ───────────────────────────────────────────────────
async function startDirect(targetUserId: number) {
  try {
    const res = await api.post(`/api/workspaces/${wsId()}/chat/rooms/direct`, {
      targetUserId,
    });
    const room = res.data.data;
    if (!chatStore.rooms.find((r: any) => r.id === room.id))
      chatStore.rooms.unshift(room);
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
  memberIds: number[];
}) {
  creatingGroup.value = true;
  try {
    const res = await api.post(
      `/api/workspaces/${wsId()}/chat/rooms/group`,
      payload,
    );
    const room = res.data.data;
    chatStore.rooms.unshift(room);
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
    const res = await api.patch(
      `/api/workspaces/${wsId()}/chat/rooms/${chatStore.activeRoomId}/name`,
      null,
      { params: { name: newName } },
    );
    chatStore.updateRoom(res.data.data);
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

async function handleAddMembers(userIds: number[]) {
  if (!chatStore.activeRoomId) return;
  addingMember.value = true;
  try {
    for (const userId of userIds) {
      await api.post(
        `/api/workspaces/${wsId()}/chat/rooms/${chatStore.activeRoomId}/members/${userId}`,
      );
    }
    showAddMember.value = false;
    await loadGroupMembers(chatStore.activeRoomId);
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
        await api.delete(
          `/api/workspaces/${wsId()}/chat/rooms/${snap}/members/${targetUserId}`,
        );
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
        await api.post(`/api/workspaces/${wsId()}/chat/rooms/${snap}/leave`);
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
        await api.delete(`/api/workspaces/${wsId()}/chat/rooms/${snap}`);
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
  chatStore.setActiveRoom(null);
});
</script>

<style scoped>
.ws-switcher-header:hover {
  background: #f1f5f9 !important;
}

.ws-switch-item {
  border-radius: 8px;
  transition: background 0.15s;
}
.ws-switch-item:hover {
  background: #f1f5f9;
}
.ws-switch-item--active {
  background: #f8fafc;
}

/* Info panel slide animation */
.slide-info-enter-active,
.slide-info-leave-active {
  transition:
    width 0.22s ease,
    opacity 0.22s ease;
  overflow: hidden;
}
.slide-info-enter-from,
.slide-info-leave-to {
  width: 0 !important;
  opacity: 0;
}
.slide-info-enter-to,
.slide-info-leave-from {
  width: 260px;
  opacity: 1;
}
</style>
