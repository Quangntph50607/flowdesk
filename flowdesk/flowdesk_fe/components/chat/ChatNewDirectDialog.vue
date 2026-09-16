<template>
  <Dialog
    :visible="visible"
    header="Chat riêng"
    modal
    style="width: 400px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-3 pt-2">
      <InputText
        v-model="search"
        placeholder="Tìm tên hoặc email..."
        class="w-full"
        autofocus
      />

      <div
        class="flex flex-col gap-1 overflow-y-auto"
        style="max-height: 320px"
      >
        <div
          v-for="m in filteredMembers"
          :key="m.userId"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
          style="transition: background 0.1s"
          :class="{ 'bg-slate-50': hoveredId === m.userId }"
          @mouseenter="hoveredId = m.userId"
          @mouseleave="hoveredId = null"
          @click="handleSelect(m.userId)"
        >
          <div
            class="flex items-center justify-center rounded-full font-semibold shrink-0"
            style="
              width: 36px;
              height: 36px;
              background: #e2e8f0;
              color: #475569;
              font-size: 13px;
            "
          >
            {{ m.fullName?.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium truncate" style="color: #0f172a">
              {{ m.fullName }}
            </p>
            <p class="text-xs truncate" style="color: #94a3b8">{{ m.email }}</p>
          </div>
        </div>

        <div
          v-if="filteredMembers.length === 0"
          class="py-8 text-center text-sm"
          style="color: #94a3b8"
        >
          {{ search ? "Không tìm thấy thành viên" : "Không có thành viên nào" }}
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Đóng"
        severity="secondary"
        text
        @click="$emit('update:visible', false)"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { WorkspaceMember } from "~/types/chat";

const props = defineProps<{
  visible: boolean;
  members: WorkspaceMember[];
  currentUserId: number;
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "select", userId: number): void;
}>();

const search = ref("");
const hoveredId = ref<number | null>(null);

const filteredMembers = computed(() => {
  const q = search.value.toLowerCase();
  return props.members.filter(
    (m) =>
      m.userId !== props.currentUserId &&
      (!q ||
        m.fullName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)),
  );
});

function handleSelect(userId: number) {
  emit("select", userId);
  emit("update:visible", false);
  search.value = "";
}

watch(
  () => props.visible,
  (val) => {
    if (!val) search.value = "";
  },
);
</script>
