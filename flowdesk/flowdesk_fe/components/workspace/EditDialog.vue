<template>
  <Dialog
    :visible="visible"
    header="Cập nhật workspace"
    modal
    style="width: 460px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Tên workspace <span class="text-red-500">*</span></label
        >
        <InputText v-model="form.name" fluid />
      </div>
    </div>
    <template #footer>
      <Button
        label="Hủy"
        severity="secondary"
        text
        class="!px-5 !text-sm"
        @click="$emit('update:visible', false)"
      />
      <Button
        label="Cập nhật"
        :loading="loading"
        class="!px-5 !text-sm"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from "primevue/usetoast";

const props = defineProps<{
  visible: boolean;
  workspace: { id: string | number; name: string } | null;
}>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "updated", name: string): void;
}>();

const api = useApi();
const toast = useToast();
const loading = ref(false);
const form = reactive({ name: "" });

watch(
  () => props.workspace,
  (val) => {
    if (val) form.name = val.name;
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.name.trim()) return;
  loading.value = true;
  try {
    await api.put(`/api/admin/workspaces/${props.workspace!.id}`, {
      name: form.name,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã cập nhật workspace",
      life: 3000,
    });
    emit("update:visible", false);
    emit("updated", form.name);
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: err.response?.data?.message ?? "Có lỗi xảy ra",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}
</script>
