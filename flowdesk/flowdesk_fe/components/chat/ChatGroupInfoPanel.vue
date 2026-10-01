<template>
  <div
    class="flex flex-col h-full bg-white border-l border-slate-100 overflow-y-auto chat-messages-area"
    style="width: 300px"
  >
    <!-- Hero -->
    <div class="flex flex-col items-center px-5 pt-6 pb-4 shrink-0">
      <!-- Avatar -->
      <div
        class="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-2xl font-bold flex items-center justify-center relative"
      >
        <img
          v-if="room.avatarUrl"
          :src="room.avatarUrl"
          :alt="room.name"
          class="w-full h-full rounded-full object-cover"
        />
        <span v-else>{{ room.avatarInitial }}</span>
        <span
          class="absolute bottom-0.5 right-0.5 w-[13px] h-[13px] rounded-full bg-green-400 border-2 border-white"
        />
        <button
          class="absolute inset-0 rounded-full bg-slate-950/0 hover:bg-slate-950/35 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          :disabled="updatingAvatar"
          @click="avatarInputRef?.click()"
        >
          <i class="pi pi-camera text-white text-[16px]" />
        </button>
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleAvatarFile"
        />
      </div>

      <!-- Name -->
      <div
        v-if="canManageGroup && editingName"
        class="flex items-center gap-1 mt-3"
      >
        <input
          v-model="newName"
          class="text-[14px] font-bold text-slate-900 text-center border-0 border-b-2 border-slate-900 outline-none bg-transparent pb-0.5"
          style="width: 150px"
          @keydown.enter="saveName"
          @keydown.esc="cancelEditName"
          autofocus
        />
        <button
          class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100"
          @click="saveName"
        >
          <i class="pi pi-check text-[10px] text-green-500" />
        </button>
        <button
          class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100"
          @click="cancelEditName"
        >
          <i class="pi pi-times text-[10px] text-red-400" />
        </button>
      </div>
      <div v-else class="flex items-center gap-1 mt-3">
        <span class="text-[15px] font-bold text-slate-900">{{
          room.name
        }}</span>
        <button
          v-if="canManageGroup"
          class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100"
          @click="startEditName"
        >
          <i class="pi pi-pencil text-[10px] text-slate-400" />
        </button>
      </div>
      <p class="text-[11px] text-slate-400 mt-0.5">
        {{ room.type === "GROUP" ? `${memberCount} thành viên` : "Chat riêng" }}
      </p>

      <!-- Quick actions -->
      <div class="flex items-center gap-3 mt-4">
        <button
          class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <i class="pi pi-phone text-[15px] text-slate-600" />
        </button>
        <button
          class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <i class="pi pi-video text-[15px] text-slate-600" />
        </button>
        <button
          class="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <i class="pi pi-search text-[15px] text-slate-600" />
        </button>
      </div>
    </div>

    <div
      v-if="room.type === 'GROUP' && panelView === 'members'"
      class="flex min-h-0 flex-1 flex-col border-t border-slate-100"
    >
      <div class="flex items-center justify-between px-2 py-3 shrink-0">
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
          @click="closeMembersView"
        >
          <i class="pi pi-arrow-left text-[13px]" />
        </button>
        <div class="min-w-0 flex-1 px-2">
          <p class="text-[13px] font-bold text-slate-900 truncate">
            Thành viên
          </p>
          <p class="text-[11px] text-slate-400">{{ memberCount }} thành viên</p>
        </div>
        <button
          class="hover:bg-gray-200 px-1.5 rounded-full"
          @click="$emit('openAddMember')"
        >
          <i class="pi pi-plus text-[10px]" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto chat-room-list-scroll px-2 pb-4">
        <div
          v-for="m in members"
          :key="m.userId"
          class="group relative flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <div
            class="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-[12px] font-bold flex items-center justify-center shrink-0 overflow-hidden"
          >
            <img
              v-if="m.avatarUrl"
              :src="m.avatarUrl"
              :alt="m.fullName"
              class="w-full h-full object-cover"
            />
            <span v-else>{{
              m.avatarInitial ?? m.fullName?.charAt(0).toUpperCase()
            }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold text-slate-900 truncate">
              {{ m.fullName }}
              <span
                v-if="m.userId === currentUserId"
                class="text-slate-400 font-normal text-[11px]"
              >
                (bạn)</span
              >
            </p>
            <p class="text-[11px] text-slate-400 truncate">
              {{ m.isOwner ? "Trưởng nhóm" : (m.email ?? "Thành viên") }}
            </p>
          </div>
          <button
            v-if="canRemoveMember(m)"
            class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop="toggleMemberMenu(m.userId)"
          >
            <i class="pi pi-ellipsis-h text-[13px]" />
          </button>
          <div
            v-if="openMemberMenuId === m.userId"
            class="absolute right-2 top-10 z-10 w-36 rounded-lg border border-slate-100 bg-white shadow-lg py-1"
          >
            <button
              class="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-red-500 hover:bg-red-50"
              @click.stop="handleRemoveFromMenu(m.userId)"
            >
              <i class="pi pi-user-minus text-[12px]" />
              Xóa khỏi nhóm
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggles -->
    <div
      v-if="panelView === 'info'"
      class="px-5 py-1 border-t border-slate-100 shrink-0"
    >
      <div class="flex items-center justify-between py-2.5">
        <div class="flex items-center gap-2.5">
          <i class="pi pi-bell text-[13px] text-slate-500" />
          <span class="text-[13px] text-slate-700">Notification</span>
        </div>
        <ToggleSwitch v-model="notifOn" />
      </div>
      <div class="flex items-center justify-between py-2.5">
        <div class="flex items-center gap-2.5">
          <i class="pi pi-volume-up text-[13px] text-slate-500" />
          <span class="text-[13px] text-slate-700">Sound</span>
        </div>
        <ToggleSwitch v-model="soundOn" />
      </div>
    </div>

    <!-- Members section -->
    <div
      v-if="panelView === 'info' && room.type === 'DIRECT'"
      class="flex flex-col shrink-0 px-5 pt-4 border-t border-slate-100"
    >
      <span
        class="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2"
        >Thông tin</span
      >
      <div class="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-slate-50">
        <div
          class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0"
        >
          <img
            v-if="directPeer?.avatarUrl ?? room.avatarUrl"
            :src="directPeer?.avatarUrl ?? room.avatarUrl ?? ''"
            :alt="directPeer?.fullName ?? room.name"
            class="w-full h-full rounded-full object-cover"
          />
          <span v-else>{{
            directPeer?.avatarInitial ?? room.avatarInitial
          }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-medium text-slate-900 truncate">
            {{ directPeer?.fullName ?? room.name }}
          </p>
          <p class="text-[11px] text-slate-400 truncate">
            {{ directPeer?.email ?? "Thành viên workspace" }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-else-if="panelView === 'info'"
      class="flex flex-col shrink-0 px-5 pt-4"
    >
      <div class="flex items-center justify-between mb-2 shrink-0">
        <span
          class="text-[11px] font-bold uppercase tracking-widest text-slate-400"
          >Thành viên</span
        >
        <button
          class="text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
          @click="panelView = 'members'"
        >
          Tất cả
        </button>
      </div>

      <div class="flex flex-col gap-0.5">
        <div
          v-for="m in previewMembers"
          :key="m.userId"
          class="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
        >
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0"
          >
            <img
              v-if="m.avatarUrl"
              :src="m.avatarUrl"
              :alt="m.fullName"
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else>{{
              m.avatarInitial ?? m.fullName?.charAt(0).toUpperCase()
            }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-slate-900 truncate">
              {{ m.fullName }}
              <span
                v-if="m.userId === currentUserId"
                class="text-slate-400 font-normal text-[11px]"
              >
                (bạn)</span
              >
            </p>
            <p v-if="m.isOwner" class="text-[11px] text-slate-400">
              Trưởng nhóm
            </p>
          </div>
          <button
            v-if="false"
            class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0"
            v-tooltip.left="'Xóa khỏi nhóm'"
            @click="$emit('removeMember', m.userId)"
          >
            <i class="pi pi-times text-[10px] text-slate-400" />
          </button>
        </div>
      </div>
    </div>

    <!-- Shared content -->
    <div
      v-if="panelView === 'info'"
      class="flex flex-col flex-1 overflow-hidden min-h-40 px-5 pt-4 border-t border-slate-100 mt-4"
    >
      <div class="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 shrink-0">
        <button
          v-for="tab in sharedTabs"
          :key="tab.key"
          class="h-7 rounded-md text-[11px] font-medium transition-colors"
          :class="
            activeSharedTab === tab.key
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          "
          @click="activeSharedTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto chat-room-list-scroll py-3">
        <!-- Media -->
        <div v-if="activeSharedTab === 'media'" class="grid grid-cols-3 gap-2">
          <a
            v-for="item in sharedMedia"
            :key="item.id"
            :href="item.content ?? '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="aspect-square rounded-lg border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500"
          >
            <img
              v-if="item.type === 'IMAGE' && item.content"
              :src="item.content"
              :alt="item.fileName ?? 'media'"
              class="w-full h-full object-cover"
            />
            <i v-else class="pi pi-video text-[18px]" />
          </a>
        </div>

        <!-- Links -->
        <div v-else-if="activeSharedTab === 'link'" class="flex flex-col gap-2">
          <a
            v-for="link in sharedLinks"
            :key="link.messageId + link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 border border-slate-100 no-underline"
          >
            <div
              class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-link text-[13px] text-slate-500" />
            </div>
            <div class="min-w-0">
              <p class="text-[12px] font-medium text-slate-800 truncate">
                {{ safeHost(link.url) }}
              </p>
              <p class="text-[11px] text-slate-400 truncate">
                {{ link.url }}
              </p>
            </div>
          </a>
        </div>

        <!-- Docs -->
        <div v-else class="flex flex-col gap-2">
          <a
            v-for="doc in sharedDocs"
            :key="doc.id"
            :href="doc.content ?? '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 border border-slate-100 no-underline"
          >
            <div
              class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-file text-[13px] text-slate-500" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[12px] font-medium text-slate-800 truncate">
                {{ doc.fileName ?? "Tài liệu" }}
              </p>
              <p class="text-[11px] text-slate-400">
                {{ formatFileSize(doc.fileSize) }}
              </p>
            </div>
            <i class="pi pi-download text-[12px] text-slate-400 shrink-0" />
          </a>
        </div>

        <div
          v-if="activeSharedItems.length === 0"
          class="h-full min-h-[96px] flex items-center justify-center text-[12px] text-slate-400"
        >
          Chưa có dữ liệu
        </div>
      </div>
    </div>

    <!-- Danger zone -->
    <div
      v-if="panelView === 'info' && room.type === 'GROUP'"
      class="px-5 py-4 border-t border-slate-100 shrink-0"
    >
      <button
        v-if="room.type === 'GROUP' && !room.isOwner"
        class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 text-[13px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 border border-red-100"
        :disabled="leaving"
        @click="$emit('leaveRoom')"
      >
        <i class="pi pi-sign-out text-[12px]" />
        {{ leaving ? "Đang rời..." : "Rời nhóm" }}
      </button>
      <button
        v-if="canManageGroup"
        class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 text-[13px] font-semibold hover:bg-red-50 transition-colors border border-red-100"
        @click="$emit('deleteRoom')"
      >
        <i class="pi pi-trash text-[12px]" />
        Xóa nhóm
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { ChatLinkItem, ChatMessage, ChatRoom } from "~/types/chat";

interface GroupMember {
  userId: number;
  fullName: string;
  email?: string | null;
  avatarInitial?: string | null;
  avatarUrl?: string | null;
  isOwner: boolean;
}

const props = defineProps<{
  room: ChatRoom;
  members: GroupMember[];
  memberCount: number;
  sharedMedia: ChatMessage[];
  sharedLinks: ChatLinkItem[];
  sharedDocs: ChatMessage[];
  currentUserId: number;
  leaving?: boolean;
  updatingAvatar?: boolean;
}>();

const emit = defineEmits<{
  (e: "rename", name: string): void;
  (e: "removeMember", userId: number): void;
  (e: "openAddMember"): void;
  (e: "updateAvatar", file: File): void;
  (e: "leaveRoom"): void;
  (e: "deleteRoom"): void;
}>();

const editingName = ref(false);
const newName = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);
const panelView = ref<"info" | "members">("info");
const openMemberMenuId = ref<number | null>(null);
const notifOn = ref(true);
const soundOn = ref(false);
const activeSharedTab = ref<"media" | "link" | "docs">("media");
const canManageGroup = computed(
  () => props.room.type === "GROUP" && props.room.isOwner,
);
const directPeer = computed(
  () => props.members.find((m) => m.userId !== props.currentUserId) ?? null,
);
const previewMembers = computed(() => props.members.slice(0, 3));

const sharedTabs = [
  { key: "media", label: "Media" },
  { key: "link", label: "Link" },
  { key: "docs", label: "Docs" },
] as const;

const activeSharedItems = computed(() => {
  if (activeSharedTab.value === "media") return props.sharedMedia;
  if (activeSharedTab.value === "link") return props.sharedLinks;
  return props.sharedDocs;
});

function startEditName() {
  newName.value = props.room.name;
  editingName.value = true;
}
function cancelEditName() {
  editingName.value = false;
  newName.value = "";
}
function saveName() {
  if (newName.value.trim() && newName.value.trim() !== props.room.name) {
    emit("rename", newName.value.trim());
  }
  editingName.value = false;
}

function handleAvatarFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit("updateAvatar", file);
  input.value = "";
}

function closeMembersView() {
  panelView.value = "info";
  openMemberMenuId.value = null;
}

function canRemoveMember(member: GroupMember) {
  return !member.isOwner && member.userId !== props.currentUserId;
}

function toggleMemberMenu(userId: number) {
  openMemberMenuId.value = openMemberMenuId.value === userId ? null : userId;
}

function handleRemoveFromMenu(userId: number) {
  openMemberMenuId.value = null;
  emit("removeMember", userId);
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>
