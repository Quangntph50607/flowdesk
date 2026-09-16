<template>
  <div>
    <!-- System message -->
    <div
      v-if="message.type === 'SYSTEM'"
      class="flex justify-center py-1.5 px-4"
    >
      <span class="text-xs px-3 py-1 rounded-full bg-slate-200 text-slate-500">
        {{ message.content }}
      </span>
    </div>

    <!-- Normal message -->
    <div
      v-else
      class="flex items-end gap-2 px-4"
      :class="[
        isMine ? 'flex-row-reverse' : 'flex-row',
        isLastInGroup ? 'mb-0.5' : 'mb-[2px]',
        isFirstInGroup ? 'mt-1' : 'mt-0',
      ]"
    >
      <!-- Avatar người khác — chỉ hiện ở bubble cuối group, không chiếm chỗ khi là tin của mình -->
      <div v-if="!isMine" class="w-[30px] shrink-0 self-center">
        <div
          v-if="isLastInGroup"
          class="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-white text-[11px] font-semibold flex items-center justify-center"
        >
          {{ message.senderAvatarInitial }}
        </div>
      </div>

      <!-- Bubble group -->
      <div
        class="flex flex-col max-w-[360px]"
        :class="isMine ? 'items-end' : 'items-start'"
      >
        <!-- Sender name — chỉ ở bubble đầu group, không phải tin của mình -->
        <span
          v-if="showSenderName && !isMine && isFirstInGroup"
          class="text-[11px] font-semibold text-slate-500 mb-1 px-1"
        >
          {{ message.senderName }}
        </span>

        <!-- Recalled -->
        <div
          v-if="message.isRecalled"
          class="px-3.5 py-2"
          :class="bubbleShapeClass"
        >
          <p class="text-sm italic opacity-50">Tin nhắn đã được thu hồi</p>
        </div>

        <!-- IMAGE -->
        <div v-else-if="message.type === 'IMAGE'">
          <div
            v-if="resolvedUrl === null"
            class="w-[200px] h-[150px] bg-slate-200 animate-pulse"
            :class="imgBorderClass"
          />
          <img
            v-else-if="!imgError"
            :src="resolvedUrl"
            :alt="message.fileName ?? 'ảnh'"
            class="block cursor-pointer object-cover"
            :class="imgBorderClass"
            style="max-width: 260px; max-height: 300px; min-width: 80px"
            @click="lightboxUrl = resolvedUrl"
            @error="imgError = true"
          />
          <div
            v-if="imgError"
            class="flex items-center gap-2 px-3 py-2 text-slate-500 text-xs bg-slate-100"
            :class="imgBorderClass"
          >
            <i class="pi pi-image text-base" />
            <span>Không tải được ảnh</span>
          </div>
        </div>

        <!-- FILE -->
        <a
          v-else-if="message.type === 'FILE'"
          :href="resolvedUrl ?? message.content ?? '#'"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 px-3.5 py-2.5 no-underline min-w-[200px] transition-opacity hover:opacity-80"
          :class="[
            bubbleShapeClass,
            isMine
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-900 border border-slate-200 shadow-sm',
          ]"
        >
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            :class="isMine ? 'bg-white/10' : 'bg-slate-100'"
          >
            <i
              class="pi pi-file text-[16px]"
              :class="isMine ? 'text-white' : 'text-slate-600'"
            />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium truncate max-w-[180px]">
              {{ message.fileName ?? "Tải xuống" }}
            </p>
            <p class="text-xs opacity-60">
              {{ formatFileSize(message.fileSize) }}
            </p>
          </div>
          <i class="pi pi-download text-[13px] shrink-0 opacity-70" />
        </a>

        <!-- VIDEO -->
        <div
          class="overflow-hidden"
          :class="imgBorderClass"
          style="max-width: 260px"
          v-else-if="message.type === 'VIDEO'"
        >
          <video
            v-if="resolvedUrl"
            :src="resolvedUrl"
            controls
            class="block max-w-full"
            style="max-height: 260px"
          />
          <div v-else class="w-[200px] h-[120px] bg-slate-200 animate-pulse" />
        </div>

        <!-- AUDIO -->
        <div
          v-else-if="message.type === 'AUDIO'"
          class="px-3 py-2"
          :class="[
            bubbleShapeClass,
            isMine
              ? 'bg-slate-900'
              : 'bg-white border border-slate-200 shadow-sm',
          ]"
        >
          <audio
            v-if="resolvedUrl"
            :src="resolvedUrl"
            controls
            class="max-w-[240px]"
          />
          <div v-else class="w-[200px] h-8 bg-white/20 animate-pulse rounded" />
        </div>

        <!-- TEXT -->
        <div
          v-else
          class="px-4 py-1.5 leading-relaxed break-words"
          :class="[
            bubbleShapeClass,
            isMine
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-900 border border-slate-200 shadow-sm',
          ]"
        >
          <p class="text-sm">{{ message.content }}</p>
        </div>

        <!-- Timestamp — chỉ hiện ở bubble cuối group -->
        <div v-if="isLastInGroup" class="flex items-center gap-1 mt-1 px-1">
          <span class="text-[10px] text-slate-400">{{
            formatMessageTime(message.createdAt)
          }}</span>
          <span
            v-if="message.isEdited && !message.isRecalled"
            class="text-[10px] text-slate-400"
          >
            · đã chỉnh sửa
          </span>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxUrl"
        class="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
        @click.self="lightboxUrl = null"
      >
        <button
          class="absolute top-4 right-4 text-white w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          @click="lightboxUrl = null"
        >
          <i class="pi pi-times text-xl" />
        </button>
        <img
          :src="lightboxUrl"
          class="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import type { ChatMessage } from "../../types/chat";
import { formatMessageTime } from "../../utils/chatFormat";

const props = defineProps<{
  message: ChatMessage;
  currentUserId: number;
  showSenderName?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}>();

const config = useRuntimeConfig();
const token = useCookie("access_token");

const isMine = computed(() => props.message.senderId === props.currentUserId);
const lightboxUrl = ref<string | null>(null);
const imgError = ref(false);
const resolvedUrl = ref<string | null | undefined>(undefined);

const needsUrl = computed(
  () =>
    ["IMAGE", "FILE", "VIDEO", "AUDIO"].includes(props.message.type) &&
    !props.message.isRecalled,
);

// ── Border-radius theo vị trí trong group (Messenger style) ─────────────────
//
// Mine (phải):
//   first-only  → bo tròn tất cả, riêng br nhỏ hơn
//   first       → bo tròn, br = 4px (đuôi chưa nhọn vì còn message sau)
//   middle      → bo tròn, br = 4px, tr = 4px
//   last        → bo tròn, br = 4px (đuôi nhọn nhất)
//
// Other (trái): ngược lại với bl

const bubbleShapeClass = computed(() => {
  const first = props.isFirstInGroup ?? true;
  const last = props.isLastInGroup ?? true;
  const only = first && last;

  if (props.message.type === "SYSTEM") return "";

  if (isMine.value) {
    if (only) return "rounded-[18px]";
    if (first) return "rounded-[18px] rounded-br-[4px]";
    if (last) return "rounded-[18px] rounded-tr-[6px]";
    return "rounded-[18px] rounded-tr-[6px] rounded-br-[6px]";
  } else {
    if (only) return "rounded-[18px]";
    if (first) return "rounded-[18px] rounded-bl-[4px]";
    if (last) return "rounded-[18px] rounded-tl-[6px]";
    return "rounded-[18px] rounded-tl-[6px] rounded-bl-[6px]";
  }
});

// Border-radius cho ảnh/video (không có padding)
const imgBorderClass = computed(() => {
  const first = props.isFirstInGroup ?? true;
  const last = props.isLastInGroup ?? true;
  const only = first && last;

  if (isMine.value) {
    if (only) return "rounded-[14px] rounded-br-[4px]";
    if (first) return "rounded-[14px] rounded-br-[4px]";
    if (last) return "rounded-[14px] rounded-tr-[6px] rounded-br-[4px]";
    return "rounded-[14px] rounded-tr-[6px] rounded-br-[6px]";
  } else {
    if (only) return "rounded-[14px] rounded-bl-[4px]";
    if (first) return "rounded-[14px] rounded-bl-[4px]";
    if (last) return "rounded-[14px] rounded-tl-[6px] rounded-bl-[4px]";
    return "rounded-[14px] rounded-tl-[6px] rounded-bl-[6px]";
  }
});

// ── Resolve file URL (presign nếu cần) ───────────────────────────────────────

async function resolveFileUrl() {
  if (!needsUrl.value || !props.message.content) {
    resolvedUrl.value = props.message.content ?? undefined;
    return;
  }

  const rawUrl = props.message.content;
  const isB2Url = rawUrl.includes("backblazeb2.com");
  const isAlreadySigned =
    rawUrl.includes("X-Amz-Signature") || rawUrl.includes("x-amz-signature");

  if (isB2Url && !isAlreadySigned) {
    resolvedUrl.value = null; // skeleton
    try {
      const url = new URL(rawUrl);
      const fileKey = url.pathname.split("/").slice(2).join("/");
      const res = await fetch(
        `${config.public.apiBase}/api/upload/presign?key=${encodeURIComponent(fileKey)}`,
        { headers: { Authorization: `Bearer ${token.value ?? ""}` } },
      );
      resolvedUrl.value = res.ok ? (await res.json()).data : rawUrl;
    } catch {
      resolvedUrl.value = rawUrl;
    }
  } else {
    resolvedUrl.value = rawUrl;
  }
}

onMounted(() => {
  if (needsUrl.value) resolveFileUrl();
});
watch(
  () => props.message.content,
  () => {
    imgError.value = false;
    if (needsUrl.value) resolveFileUrl();
  },
);

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>
