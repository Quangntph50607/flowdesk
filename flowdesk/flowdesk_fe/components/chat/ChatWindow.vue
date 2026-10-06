<template>
  <div class="flex flex-col h-full overflow-hidden" style="background: #f5f5f5">
    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div
      class="flex items-center justify-between px-5 h-[64px] bg-white border-b border-slate-100 shrink-0 gap-3"
    >
      <div class="flex items-center gap-3 min-w-0">
        <!-- Avatar -->
        <div class="relative shrink-0">
          <img
            v-if="room.avatarUrl"
            :src="room.avatarUrl"
            :alt="room.name"
            class="w-[40px] h-[40px] rounded-full"
          />
          <div
            v-else
            class="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-[14px] font-bold flex items-center justify-center"
          >
            {{ room.avatarInitial }}
          </div>
          <span
            class="absolute bottom-0 right-0 w-[11px] h-[11px] rounded-full bg-green-400 border-2 border-white"
          />
        </div>
        <div class="min-w-0">
          <p
            class="font-semibold text-[14px] text-slate-900 truncate leading-tight"
          >
            {{ room.name }}
          </p>
          <p class="text-[11px] text-slate-400">
            {{
              room.type === "GROUP"
                ? `${room.memberCount ?? ""} thành viên`
                : "Đang hoạt động"
            }}
          </p>
        </div>
      </div>

      <!-- Header actions -->
      <div class="flex items-center gap-0.5 shrink-0">
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <i class="pi pi-phone text-[14px]" />
        </button>
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <i class="pi pi-video text-[14px]" />
        </button>
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <i class="pi pi-search text-[14px]" />
        </button>
        <button
          class="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          :class="
            infoOpen
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          "
          v-tooltip.bottom="infoOpen ? 'Ẩn thông tin' : 'Thông tin'"
          @click="$emit('toggleInfo')"
        >
          <i class="pi pi-ellipsis-h text-[14px]" />
        </button>
      </div>
    </div>

    <!-- ── Messages ─────────────────────────────────────────────────── -->
    <div
      ref="messagesContainerRef"
      class="flex-1 overflow-y-auto px-2 py-3 flex flex-col chat-messages-area"
      @scroll="onScroll"
    >
      <div v-if="loadingMore" class="flex justify-center py-2 shrink-0">
        <ProgressSpinner style="width: 20px; height: 20px" />
      </div>

      <template v-for="item in enrichedMessages" :key="item.msg.id">
        <!-- Date separator -->
        <div
          v-if="item.showTimeSeparator"
          class="flex items-center gap-3 px-2 py-3 shrink-0"
        >
          <div class="flex-1 h-px bg-slate-200" />
          <span class="text-[11px] text-slate-400 font-medium shrink-0 px-1">
            {{ formatSeparatorTime(item.msg.createdAt) }}
          </span>
          <div class="flex-1 h-px bg-slate-200" />
        </div>

        <ChatMessageBubble
          :message="item.msg"
          :current-user-id="currentUserId"
          :show-sender-name="room.type === 'GROUP'"
          :is-first-in-group="item.isFirst"
          :is-last-in-group="item.isLast"
          @reply="startReply"
          @edit="startEdit"
          @recall="$emit('recallMessage', $event.id)"
        />
      </template>

      <div
        v-if="messages.length === 0 && !loadingMore"
        class="flex-1 flex flex-col items-center justify-center py-16 text-slate-400"
      >
        <div
          class="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-3"
        >
          <i class="pi pi-comments text-2xl text-slate-400" />
        </div>
        <p class="text-sm font-medium text-slate-500">
          Hãy bắt đầu cuộc trò chuyện
        </p>
      </div>
    </div>

    <!-- ── File preview bar ─────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition-all duration-200 ease-in"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="pendingFile"
        class="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-3"
      >
        <img
          v-if="pendingFilePreview && isImageFile(pendingFile)"
          :src="pendingFilePreview"
          class="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
        />
        <div
          v-else
          class="w-14 h-14 rounded-xl bg-slate-100 flex flex-col items-center justify-center shrink-0 border border-slate-200"
        >
          <i class="pi pi-file text-lg text-slate-500" />
          <span
            class="text-[9px] text-slate-400 mt-0.5 uppercase font-medium"
            >{{ fileExtension(pendingFile.name) }}</span
          >
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-800 truncate">
            {{ pendingFile.name }}
          </p>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ formatFileSize(pendingFile.size) }}
          </p>
          <!-- Upload progress bar -->
          <div
            v-if="uploading"
            class="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden"
          >
            <div
              class="h-full bg-slate-900 rounded-full transition-all"
              :style="{ width: uploadProgress + '%' }"
            />
          </div>
        </div>
        <button
          class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-red-400 transition-colors shrink-0"
          @click="clearPendingFile"
        >
          <i class="pi pi-times text-[12px]" />
        </button>
        <button
          class="h-8 px-4 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
          style="background: #1a1a2e"
          :disabled="uploading"
          @click="handleSendFile"
        >
          <i v-if="uploading" class="pi pi-spin pi-spinner text-[11px]" />
          <i v-else class="pi pi-send text-[11px]" />
          {{ uploading ? uploadProgress + "%" : "Gửi" }}
        </button>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-all duration-200 ease-in"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="translate-y-2 opacity-0"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="replyTarget || editingMessage"
        class="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-3"
      >
        <div
          class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"
        >
          <i
            :class="
              editingMessage
                ? 'pi pi-pencil text-[13px]'
                : 'pi pi-reply text-[13px]'
            "
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-slate-700">
            {{
              editingMessage
                ? "Sửa tin nhắn"
                : `Trả lời ${replyTarget?.senderName}`
            }}
          </p>
          <p class="text-xs text-slate-400 truncate">
            {{
              editingMessage
                ? editingMessage.content
                : previewMessage(replyTarget)
            }}
          </p>
        </div>
        <button
          class="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0"
          @click="clearComposerMode"
        >
          <i class="pi pi-times text-[12px]" />
        </button>
      </div>
    </Transition>

    <!-- ── Input bar ────────────────────────────────────────────────── -->
    <div
      class="flex items-center gap-2 px-4 py-3 bg-white border-t border-slate-100 shrink-0"
    >
      <!-- File input ẩn -->
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
        @change="onFileSelected"
      />

      <!-- Emoji -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
      >
        <i class="pi pi-face-smile text-[18px]" />
      </button>

      <!-- Attachment -->
      <button
        class="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0"
        :class="
          pendingFile
            ? 'text-slate-900 bg-slate-100'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
        "
        v-tooltip.top="'Đính kèm'"
        @click="fileInputRef?.click()"
      >
        <i class="pi pi-paperclip text-[16px]" />
      </button>

      <!-- Text input -->
      <div class="flex-1 relative">
        <input
          v-model="inputText"
          placeholder="Write your message..."
          :disabled="!!pendingFile"
          class="w-full py-2 px-4 rounded-2xl outline-none text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-40"
          style="background: #f1f3f4; border: none"
          @keydown.enter.prevent="handleSend"
        />
      </div>

      <!-- Send button -->
      <button
        class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
        :class="
          inputText.trim() && !pendingFile
            ? 'text-white shadow-md hover:scale-105'
            : 'bg-slate-200 text-slate-400 cursor-default'
        "
        :style="inputText.trim() && !pendingFile ? 'background:#1a1a2e' : ''"
        :disabled="!inputText.trim() || !!pendingFile"
        @click="handleSend"
      >
        <i class="pi pi-send text-[13px]" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ChatRoom, ChatMessage } from "~/types/chat";
import { useFileUpload } from "~/composables/useFileUpload";

const props = defineProps<{
  room: ChatRoom;
  messages: ChatMessage[];
  currentUserId: number;
  loadingMore: boolean;
  infoOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: "send", content: string, replyToMessageId?: number | null): void;
  (
    e: "sendFile",
    fileUrl: string,
    fileType: "IMAGE" | "FILE" | "VIDEO" | "AUDIO",
    fileName: string,
    fileSize: number,
    replyToMessageId?: number | null,
  ): void;
  (e: "editMessage", messageId: number, content: string): void;
  (e: "recallMessage", messageId: number): void;
  (e: "loadMore"): void;
  (e: "toggleInfo"): void;
}>();

const inputText = ref("");
const replyTarget = ref<ChatMessage | null>(null);
const editingMessage = ref<ChatMessage | null>(null);
const messagesContainerRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const toast = useAppToast();

// ── File size limits ─────────────────────────────────────────────
const FILE_LIMITS: Record<string, number> = {
  image: 20 * 1024 * 1024,
  video: 30 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  other: 20 * 1024 * 1024,
};

function getFileCategory(file: File): string {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "other";
}

function getMaxSize(file: File): number {
  return FILE_LIMITS[getFileCategory(file)] ?? FILE_LIMITS.other;
}

// ── Message grouping ─────────────────────────────────────────────
interface EnrichedMessage {
  msg: ChatMessage;
  isFirst: boolean;
  isLast: boolean;
  showTimeSeparator: boolean;
}

const enrichedMessages = computed<EnrichedMessage[]>(() => {
  const list = props.messages;
  let lastSeparatorDate: Date | null = null;

  return list.map((msg, i) => {
    const prev = list[i - 1];
    const next = list[i + 1];
    const isSystem = msg.type === "SYSTEM";
    const prevIsSystem = prev?.type === "SYSTEM";
    const nextIsSystem = next?.type === "SYSTEM";

    const gapBefore = prev
      ? new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()
      : Infinity;
    const gapAfter = next
      ? new Date(next.createdAt).getTime() - new Date(msg.createdAt).getTime()
      : Infinity;

    const sameSenderPrev =
      !isSystem && !prevIsSystem && prev?.senderId === msg.senderId;
    const sameSenderNext =
      !isSystem && !nextIsSystem && next?.senderId === msg.senderId;

    // Group trong cùng ngày
    const sameDayPrev = prev
      ? isSameCalendarDay(new Date(msg.createdAt), new Date(prev.createdAt))
      : false;
    const sameDayNext = next
      ? isSameCalendarDay(new Date(msg.createdAt), new Date(next.createdAt))
      : false;

    const inGroupWithPrev = sameSenderPrev && sameDayPrev;
    const inGroupWithNext = sameSenderNext && sameDayNext;

    const msgDate = new Date(msg.createdAt);
    const showTimeSeparator =
      !isSystem &&
      (!lastSeparatorDate || !isSameCalendarDay(lastSeparatorDate, msgDate));
    if (!isSystem && !isNaN(msgDate.getTime())) lastSeparatorDate = msgDate;

    return {
      msg,
      isFirst: !inGroupWithPrev,
      isLast: !inGroupWithNext,
      showTimeSeparator,
    };
  });
});

function formatSeparatorTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (isNaN(d.getTime())) return "";
  if (isSameCalendarDay(d, now)) return "Hôm nay";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameCalendarDay(d, yesterday)) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

// ── File handling ────────────────────────────────────────────────
const pendingFile = ref<File | null>(null);
const pendingFilePreview = ref<string | null>(null);
const { uploading, uploadProgress, uploadChatFile } = useFileUpload();

function handleSend() {
  const content = inputText.value.trim();
  if (!content) return;
  if (editingMessage.value) {
    emit("editMessage", editingMessage.value.id, content);
    inputText.value = "";
    clearComposerMode();
    return;
  }
  emit("send", content, replyTarget.value?.id ?? null);
  inputText.value = "";
  replyTarget.value = null;
}

function startReply(message: ChatMessage) {
  editingMessage.value = null;
  replyTarget.value = message;
}

function startEdit(message: ChatMessage) {
  replyTarget.value = null;
  editingMessage.value = message;
  inputText.value = message.content ?? "";
}

function clearComposerMode() {
  replyTarget.value = null;
  editingMessage.value = null;
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = "";

  const maxSize = getMaxSize(file);
  if (file.size > maxSize) {
    toast.add({
      severity: "warn",
      summary: "File quá lớn",
      detail: `${file.type.startsWith("video/") ? "Video" : "File"} tối đa ${formatFileSize(maxSize)}. File của bạn: ${formatFileSize(file.size)}`,
      life: 4000,
    });
    return;
  }

  pendingFile.value = file;
  if (isImageFile(file)) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingFilePreview.value = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  } else {
    pendingFilePreview.value = null;
  }
}

async function handleSendFile() {
  if (!pendingFile.value || uploading.value) return;
  const result = await uploadChatFile(pendingFile.value);
  if (!result) {
    toast.add({
      severity: "error",
      summary: "Gửi file thất bại",
      detail: "Vui lòng thử lại.",
      life: 3000,
    });
    return;
  }
  emit(
    "sendFile",
    result.fileUrl,
    resolveMessageType(pendingFile.value),
    result.fileName,
    result.fileSize,
    replyTarget.value?.id ?? null,
  );
  clearPendingFile();
  replyTarget.value = null;
}

function clearPendingFile() {
  pendingFile.value = null;
  pendingFilePreview.value = null;
}

function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (el.scrollTop < 60 && !props.loadingMore) emit("loadMore");
}

// ── Helpers ──────────────────────────────────────────────────────
function isImageFile(f: File) {
  return f.type.startsWith("image/");
}
function resolveMessageType(f: File): "IMAGE" | "FILE" | "VIDEO" | "AUDIO" {
  if (f.type.startsWith("image/")) return "IMAGE";
  if (f.type.startsWith("video/")) return "VIDEO";
  if (f.type.startsWith("audio/")) return "AUDIO";
  return "FILE";
}
function fileExtension(name: string) {
  return name.split(".").pop()?.substring(0, 4) ?? "file";
}
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function previewMessage(message: ChatMessage | null) {
  if (!message) return "";
  if (message.isRecalled) return "Tin nhắn đã được thu hồi";
  if (message.type === "IMAGE") return "Đã gửi ảnh";
  if (message.type === "FILE") return message.fileName ?? "File";
  if (message.type === "VIDEO") return "Đã gửi video";
  if (message.type === "AUDIO") return "Đã gửi audio";
  return message.content ?? "";
}

// ── Expose ───────────────────────────────────────────────────────
function scrollToBottom(smooth = false) {
  const el = messagesContainerRef.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}
function preserveScrollAfterPrepend(prevScrollHeight: number) {
  const el = messagesContainerRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight - prevScrollHeight;
}
function getScrollHeight() {
  return messagesContainerRef.value?.scrollHeight ?? 0;
}
defineExpose({ scrollToBottom, preserveScrollAfterPrepend, getScrollHeight });
</script>
