<template>
  <Dialog
    :visible="visible"
    header="Tạo nhóm mới"
    modal
    style="width: 460px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4 pt-2">
      <!-- Tên nhóm -->
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium" style="color: #374151">
          Tên nhóm <span class="text-red-500">*</span>
        </label>
        <InputText
          v-model="groupName"
          placeholder="Nhập tên nhóm..."
          class="w-full"
          autofocus
        />
      </div>

      <!-- Tìm thành viên -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium" style="color: #374151"
          >Thêm thành viên</label
        >
        <InputText
          v-model="search"
          placeholder="Tìm tên hoặc email..."
          class="w-full"
        />

        <!-- Selected chips -->
        <div v-if="selected.length > 0" class="flex flex-wrap gap-1.5">
          <div
            v-for="m in selected"
            :key="m.userId"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style="background: #0f172a; color: #ffffff"
          >
            <span>{{ m.fullName }}</span>
            <i
              class="pi pi-times cursor-pointer"
              style="font-size: 10px; opacity: 0.7"
              @click="toggleMember(m)"
            />
          </div>
        </div>

        <!-- Member list -->
        <div
          class="flex flex-col gap-0.5 overflow-y-auto"
          style="max-height: 240px"
        >
          <div
            v-for="m in filteredMembers"
            :key="m.userId"
            class="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer"
            :style="{
              background: isSelected(m.userId) ? '#f1f5f9' : 'transparent',
            }"
            @click="toggleMember(m)"
          >
            <Checkbox
              :modelValue="isSelected(m.userId)"
              :binary="true"
              @click.stop
              @change="toggleMember(m)"
            />
            <div
              class="flex items-center justify-center rounded-full font-semibold shrink-0"
              style="
                width: 32px;
                height: 32px;
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
              <p class="text-xs truncate" style="color: #94a3b8">
                {{ m.email }}
              </p>
            </div>
          </div>

          <div
            v-if="filteredMembers.length === 0"
            class="py-6 text-center text-sm"
            style="color: #94a3b8"
          >
            {{
              search ? "Không tìm thấy thành viên" : "Không có thành viên nào"
            }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Hủy" severity="secondary" text @click="handleClose" />
      <Button
        label="Tạo nhóm"
        :loading="loading"
        :disabled="!groupName.trim() || selected.length === 0"
        @click="handleCreate"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { WorkspaceMember } from "../../types/chat";

const props = defineProps<{
  visible: boolean;
  members: WorkspaceMember[];
  currentUserId: number;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "create", payload: { name: string; memberIds: number[] }): void;
}>();

const groupName = ref("");
const search = ref("");
const selected = ref<WorkspaceMember[]>([]);

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

function handleCreate() {
  if (!groupName.value.trim() || selected.value.length === 0) return;
  emit("create", {
    name: groupName.value.trim(),
    memberIds: selected.value.map((m) => m.userId),
  });
}

function handleClose() {
  emit("update:visible", false);
}

function reset() {
  groupName.value = "";
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
