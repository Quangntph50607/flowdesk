<template>
  <Dialog
    :visible="visible"
    :header="branch ? 'Cập nhật chi nhánh' : 'Tạo chi nhánh mới'"
    modal
    style="width: 460px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Tên chi nhánh <span class="text-red-500">*</span></label
        >
        <InputText v-model="form.name" placeholder="Nhập tên chi nhánh" fluid />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Slug <span class="text-red-500">*</span></label
        >
        <InputText
          v-model="form.slug"
          placeholder="ten-chi-nhanh"
          fluid
          :disabled="!!branch"
        />
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
        :label="branch ? 'Cập nhật' : 'Tạo'"
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
  workspaceId: string | number;
  branch?: { id: number; name: string; slug?: string } | null;
}>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "saved"): void;
}>();

const api = useApi();
const toast = useToast();
const loading = ref(false);
const form = reactive({ name: "", slug: "" });

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

watch(
  () => form.name,
  (val) => {
    if (!props.branch) form.slug = toSlug(val);
  },
);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.name = props.branch?.name ?? "";
      form.slug = props.branch?.slug ?? "";
    }
  },
);

async function handleSubmit() {
  if (!form.name.trim()) return;
  if (!props.branch && !form.slug.trim()) return;
  loading.value = true;
  try {
    if (props.branch) {
      await api.put(
        `/api/workspaces/${props.workspaceId}/branches/${props.branch.id}`,
        { name: form.name },
      );
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã cập nhật chi nhánh",
        life: 3000,
      });
    } else {
      await api.post(`/api/workspaces/${props.workspaceId}/branches`, {
        name: form.name,
        slug: form.slug,
      });
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã tạo chi nhánh",
        life: 3000,
      });
    }
    emit("update:visible", false);
    emit("saved");
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
