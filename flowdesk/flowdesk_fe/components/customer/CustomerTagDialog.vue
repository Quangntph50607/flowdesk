<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="Quản lý tag"
    modal
    class="w-[520px] max-w-[calc(100vw-2rem)]"
  >
    <div class="flex flex-col gap-4">
      <div
        class="flex min-h-[34px] items-center rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[13px] font-semibold text-slate-600"
      >
        <span>{{ tagWorkspaceName }}</span>
      </div>

      <form
        class="grid grid-cols-[minmax(0,1fr)_42px_auto] items-center gap-2"
        @submit.prevent="$emit('create')"
      >
        <InputText
          v-model="tagForm.name"
          class="w-full"
          :invalid="Boolean(tagErrors.name)"
          placeholder="Tên tag"
        />
        <input
          v-model="tagForm.color"
          type="color"
          class="h-[42px] w-[42px] rounded-lg border border-slate-300 bg-white p-[3px]"
          aria-label="Màu tag"
        />
        <Button
          icon="pi pi-plus"
          label="Thêm"
          type="submit"
          :loading="tagSaving"
        />
      </form>
      <div
        v-if="tagErrors.name || tagErrors.color"
        class="-mt-2 text-xs text-red-600"
      >
        {{ tagErrors.name || tagErrors.color }}
      </div>

      <div class="flex max-h-[280px] flex-col gap-2 overflow-auto">
        <div
          v-for="tag in tagDrafts"
          :key="tag.id"
          class="grid grid-cols-[42px_minmax(0,1fr)_36px_36px] items-center gap-2"
        >
          <input
            v-model="tag.color"
            type="color"
            class="h-[42px] w-[42px] rounded-lg border border-slate-300 bg-white p-[3px]"
            aria-label="Màu tag"
          />
          <InputText v-model="tag.name" class="w-full" />
          <Button
            icon="pi pi-save"
            text
            rounded
            severity="secondary"
            @click="$emit('update-tag', tag)"
          />
          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            :loading="deletingTagId === tag.id"
            @click="$emit('delete-tag', tag)"
          />
        </div>
        <div
          v-if="!tagDrafts.length"
          class="py-[18px] text-center text-[13px] text-slate-400"
        >
          Chưa có tag
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          label="Đóng"
          severity="secondary"
          text
          type="button"
          @click="dialogVisible = false"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  tagWorkspaceName: string;
  tagForm: { name: string; color: string };
  tagDrafts: any[];
  tagSaving: boolean;
  deletingTagId: number | null;
  tagErrors: Record<string, string>;
}>();

const emit = defineEmits<{
  (event: "update:visible", value: boolean): void;
  (event: "create"): void;
  (event: "update-tag", tag: any): void;
  (event: "delete-tag", tag: any): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});
</script>
