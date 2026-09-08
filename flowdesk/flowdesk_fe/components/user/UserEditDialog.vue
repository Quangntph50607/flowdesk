<template>
  <Dialog
    :visible="visible"
    header="Cập nhật người dùng"
    modal
    style="width: 440px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Họ và tên</label>
        <InputText v-model="form.fullName" fluid />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Email</label>
        <InputText v-model="form.email" disabled fluid />
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
  user: { id: number; fullName: string; email: string } | null;
}>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "updated"): void;
}>();

const api = useApi();
const toast = useToast();
const loading = ref(false);

const form = reactive({ fullName: "", email: "" });

watch(
  () => props.user,
  (val) => {
    if (val) {
      form.fullName = val.fullName;
      form.email = val.email;
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  loading.value = true;
  try {
    await api.patch(`/api/admin/users/${props.user!.id}`, {
      fullName: form.fullName,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã cập nhật người dùng",
      life: 3000,
    });
    emit("update:visible", false);
    emit("updated");
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
