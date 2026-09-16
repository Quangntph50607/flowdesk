<template>
  <Dialog
    :visible="visible"
    header="Thêm thành viên"
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
        class="flex flex-col gap-0.5 overflow-y-auto"
        style="max-height: 300px"
      >
        <div
          v-for="m in filteredMembers"
          :key="m.userId"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
          :style="{
            background: isSelected(m.userId) ? '#f1f5f9' : 'transparent',
          }"
          @click="toggleMember(m)"
        >
          <Checkbox
            :modelValue="isSelected(m.userId)"
            :binary="true"
            @click.stop
          />
          <div
            class="flex items-center justify-center rounded-full font-semibold shrink-0"
            style="
              width: 34px;
              height: 34px;
              background: #e2e8f0;
              color: #475569;
              font-size: 12px;
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
          {{
            search
              ? "Không tìm thấy thành viên"
              : "Tất cả thành viên đã ở trong nhóm"
          }}
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Hủy" severity="secondary" text @click="handleClose" />
      <Button
        label="Thêm"
        :loading="loading"
        :disabled="selected.length === 0"
        @click="handleAdd"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { WorkspaceMember } from "../../types/chat";

const props = defineProps<{
  visible: boolean;
  /** Thành viên workspace chưa có trong group */
  availableMembers: WorkspaceMember[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "add", userIds: number[]): void;
}>();

const search = ref("");
const selected = ref<WorkspaceMember[]>([]);

const filteredMembers = computed(() => {
  const q = search.value.toLowerCase();
  return props.availableMembers.filter(
    (m) =>
      !q ||
      m.fullName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q),
  );
});

function isSelected(userId: number): boolean {
  return selected.value.some((m) => m.userId === userId);
}

function toggleMember(m: WorkspaceMember) {
  if (isSelected(m.userId)) {
    selected.value = selected.value.filter((s) => s.userId !== m.userId);
  } else {
    selected.value.push(m);
  }
}

function handleAdd() {
  if (selected.value.length === 0) return;
  emit(
    "add",
    selected.value.map((m) => m.userId),
  );
}

function handleClose() {
  emit("update:visible", false);
}

function reset() {
  search.value = "";
  selected.value = [];
}

watch(
  () => props.visible,
  (val) => {
    if (!val) reset();
  },
);
</script>
