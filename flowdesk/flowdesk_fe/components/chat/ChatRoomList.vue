<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 h-[64px] border-b border-slate-100 shrink-0"
    >
      <span class="font-bold text-[16px] text-slate-900">Chats</span>
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        v-tooltip.bottom="'Chat mới'"
        @click="$emit('openNewDirect')"
      >
        <i class="pi pi-plus text-[14px]" />
      </button>
    </div>

    <!-- Search -->
    <div class="px-4 pt-3 pb-2 shrink-0">
      <div
        class="flex items-center gap-2 px-3 py-2 rounded-xl"
        style="background: #f1f3f4"
      >
        <i
          class="pi pi-search shrink-0"
          style="color: #94a3b8; font-size: 12px"
        />
        <input
          v-model="search"
          placeholder="Search"
          class="flex-1 border-none outline-none bg-transparent text-[13px] placeholder:text-slate-400"
          style="color: #0f172a"
        />
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex px-4 pb-2 gap-1 shrink-0">
      <button
        class="flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
        :class="
          activeTab === 'chat'
            ? 'bg-slate-900 text-white'
            : 'text-slate-500 hover:bg-slate-100'
        "
        @click="activeTab = 'chat'"
      >
        Chat
      </button>
      <button
        class="flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-colors"
        :class="
          activeTab === 'group'
            ? 'bg-slate-900 text-white'
            : 'text-slate-500 hover:bg-slate-100'
        "
        @click="
          activeTab = 'group';
          $emit('openCreateGroup');
        "
      >
        Nhóm
      </button>
    </div>

    <!-- Room list -->
    <div class="flex-1 overflow-y-auto chat-room-list-scroll px-2">
      <div
        v-for="room in filteredRooms"
        :key="room.id"
        class="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer transition-colors mb-0.5"
        :class="
          room.id === chatStore.activeRoomId
            ? 'bg-slate-100'
            : 'hover:bg-slate-50'
        "
        @click="$emit('selectRoom', room.id)"
      >
        <!-- Avatar -->
        <div class="relative shrink-0">
          <div
            class="w-[44px] h-[44px] rounded-full bg-gradient-to-br from-slate-600 to-slate-400 text-white text-[15px] font-bold flex items-center justify-center"
            :class="
              room.id === chatStore.activeRoomId
                ? 'from-slate-400 to-slate-300'
                : ''
            "
          >
            {{ room.avatarInitial }}
          </div>
          <span
            class="absolute bottom-[1px] right-[1px] w-[10px] h-[10px] rounded-full bg-green-500 border-2 border-white"
          />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-sm font-semibold text-slate-900 truncate">{{
              room.name
            }}</span>
            <span class="text-[11px] text-slate-400 shrink-0">{{
              formatChatTime(room.lastMessageAt)
            }}</span>
          </div>
          <div class="flex items-center justify-between gap-1 mt-0.5">
            <span
              class="text-[12px] truncate"
              :class="
                room.id === chatStore.activeRoomId
                  ? 'text-slate-400'
                  : 'text-slate-400'
              "
              style="max-width: 150px"
            >
              {{ formatLastMessage(room.lastMessage) }}
            </span>
            <Badge
              v-if="room.unreadCount > 0"
              :value="String(room.unreadCount > 99 ? '99+' : room.unreadCount)"
              severity="danger"
              class="shrink-0"
              style="font-size: 10px; min-width: 18px; height: 18px"
            />
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="filteredRooms.length === 0" class="px-4 py-10 text-center">
        <i class="pi pi-comments text-3xl mb-2 block text-slate-300" />
        <p class="text-sm text-slate-400">
          {{ search ? "Không tìm thấy kết quả" : "Chưa có cuộc trò chuyện" }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ChatRoom } from "~/types/chat";
import { formatChatTime } from "~/utils/chatFormat";

const props = defineProps<{ rooms: ChatRoom[] }>();

defineEmits<{
  (e: "selectRoom", id: number): void;
  (e: "openNewDirect"): void;
  (e: "openCreateGroup"): void;
}>();

const chatStore = useChatStore();
const search = ref("");
const activeTab = ref<"chat" | "group">("chat");

function formatLastMessage(msg: string | null | undefined): string {
  if (!msg) return "Chưa có tin nhắn";
  if (msg.startsWith("https://") || msg.startsWith("http://")) {
    const lower = msg.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(lower))
      return "🖼️ Đã gửi ảnh";
    if (/\.(mp4|webm|mov)(\?|$)/.test(lower)) return "🎥 Đã gửi video";
    if (/\.(mp3|ogg|wav|m4a)(\?|$)/.test(lower)) return "🎵 Đã gửi audio";
    return "📎 Đã gửi file";
  }
  return msg;
}

const filteredRooms = computed(() => {
  let list = props.rooms;
  if (activeTab.value === "group")
    list = list.filter((r) => r.type === "GROUP");
  if (!search.value.trim()) return list;
  const q = search.value.toLowerCase();
  return list.filter((r) => r.name?.toLowerCase().includes(q));
});
</script>
