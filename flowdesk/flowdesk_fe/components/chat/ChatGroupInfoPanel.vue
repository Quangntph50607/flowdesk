<template>
  <div
    class="flex flex-col h-full bg-white border-l border-slate-100 overflow-hidden"
    style="width: 300px"
  >
    <!-- Hero -->
    <div class="flex flex-col items-center px-5 pt-6 pb-4 shrink-0">
      <!-- Avatar -->
      <div
        class="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-2xl font-bold flex items-center justify-center relative"
      >
        {{ room.avatarInitial }}
        <span
          class="absolute bottom-0.5 right-0.5 w-[13px] h-[13px] rounded-full bg-green-400 border-2 border-white"
        />
      </div>

      <!-- Name -->
      <div
        v-if="room.isOwner && editingName"
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
          v-if="room.isOwner"
          class="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100"
          @click="startEditName"
        >
          <i class="pi pi-pencil text-[10px] text-slate-400" />
        </button>
      </div>
      <p class="text-[11px] text-slate-400 mt-0.5">
        {{
          room.type === "GROUP" ? `${memberCount} thành viên` : "Trực tiếp"
        }}
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

    <!-- Toggles -->
    <div class="px-5 py-1 border-t border-slate-100 shrink-0">
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
    <div class="flex flex-col shrink-0 px-5 pt-4">
      <div class="flex items-center justify-between mb-2 shrink-0">
        <span
          class="text-[11px] font-bold uppercase tracking-widest text-slate-400"
          >Members</span
        >
        <button
          v-if="room.isOwner"
          class="text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
          @click="$emit('openAddMember')"
        >
          See All
        </button>
      </div>

      <div class="flex flex-col gap-0.5 max-h-[170px] overflow-y-auto chat-room-list-scroll">
        <div
          v-for="m in members"
          :key="m.userId"
          class="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
        >
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0"
          >
            {{ m.fullName?.charAt(0).toUpperCase() }}
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
            v-if="room.isOwner && !m.isOwner && m.userId !== currentUserId"
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
    <div class="flex flex-col flex-1 overflow-hidden px-5 pt-4 border-t border-slate-100 mt-4">
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
        <div
          v-if="activeSharedTab === 'media'"
          class="grid grid-cols-3 gap-2"
        >
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
            <i
              v-else
              class="pi pi-video text-[18px]"
            />
          </a>
        </div>

        <!-- Links -->
        <div
          v-else-if="activeSharedTab === 'link'"
          class="flex flex-col gap-2"
        >
          <a
            v-for="link in sharedLinks"
            :key="link.messageId + link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 border border-slate-100 no-underline"
          >
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
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
        <div
          v-else
          class="flex flex-col gap-2"
        >
          <a
            v-for="doc in sharedDocs"
            :key="doc.id"
            :href="doc.content ?? '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 border border-slate-100 no-underline"
          >
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
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
    <div class="px-5 py-4 border-t border-slate-100 shrink-0">
      <button
        v-if="!room.isOwner"
        class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-red-500 text-[13px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 border border-red-100"
        :disabled="leaving"
        @click="$emit('leaveRoom')"
      >
        <i class="pi pi-sign-out text-[12px]" />
        {{ leaving ? "Đang rời..." : "Rời nhóm" }}
      </button>
      <button
        v-if="room.isOwner"
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
}>();

const emit = defineEmits<{
  (e: "rename", name: string): void;
  (e: "removeMember", userId: number): void;
  (e: "openAddMember"): void;
  (e: "leaveRoom"): void;
  (e: "deleteRoom"): void;
}>();

const editingName = ref(false);
const newName = ref("");
const notifOn = ref(true);
const soundOn = ref(false);
const activeSharedTab = ref<"media" | "link" | "docs">("media");

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
