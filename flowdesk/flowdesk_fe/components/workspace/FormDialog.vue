<template>
  <Dialog
    :visible="visible"
    :header="workspace ? 'Cập nhật Workspace' : 'Tạo Workspace mới'"
    modal
    style="width: 480px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Tên workspace <span class="text-red-500">*</span></label
        >
        <InputText v-model="form.name" placeholder="Nhập tên workspace" fluid />
      </div>
      <template v-if="!workspace">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Slug <span class="text-red-500">*</span></label
          >
          <InputText v-model="form.slug" placeholder="ten-workspace" fluid />
          <span class="text-xs" style="color: #94a3b8"
            >Tự động tạo từ tên, có thể chỉnh sửa</span
          >
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Email chủ sở hữu (Owner) <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="form.ownerEmail"
            placeholder="owner@example.com"
            fluid
          />
        </div>
      </template>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Mô tả</label>
        <Textarea
          v-model="form.description"
          placeholder="Nhập mô tả"
          rows="3"
          fluid
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
        :label="workspace ? 'Cập nhật' : 'Tạo'"
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
  workspace?: {
    id: number;
    name: string;
    slug?: string;
    description?: string;
  } | null;
}>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "saved"): void;
}>();

const api = useApi();
const toast = useToast();
const loading = ref(false);
const form = reactive({ name: "", slug: "", description: "", ownerEmail: "" });

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
    if (!props.workspace) form.slug = toSlug(val);
  },
);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.name = props.workspace?.name ?? "";
      form.slug = props.workspace?.slug ?? "";
      form.description = props.workspace?.description ?? "";
      form.ownerEmail = "";
    }
  },
);

async function handleSubmit() {
  if (!form.name.trim()) return;
  if (!props.workspace && !form.slug.trim()) return;
  loading.value = true;
  try {
    if (props.workspace) {
      await api.put(`/api/admin/workspaces/${props.workspace.id}`, {
        name: form.name,
      });
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã cập nhật workspace",
        life: 3000,
      });
    } else {
      await api.post("/api/admin/workspaces", {
        name: form.name,
        slug: form.slug,
        description: form.description,
        ownerEmail: form.ownerEmail || undefined,
      });
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã tạo workspace",
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
