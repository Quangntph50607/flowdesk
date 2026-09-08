<template>
  <Dialog
    :visible="visible"
    header="Thêm người dùng"
    modal
    style="width: 440px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Họ và tên</label>
        <InputText v-model="form.fullName" fluid placeholder="Nguyễn Văn A" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Email</label>
        <InputText
          v-model="form.email"
          fluid
          placeholder="example@flowdesk.vn"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Mật khẩu</label>
        <Password
          v-model="form.password"
          fluid
          :feedback="false"
          toggleMask
          placeholder="Ít nhất 6 ký tự"
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
        label="Tạo người dùng"
        :loading="loading"
        class="!px-5 !text-sm"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { useToast } from "primevue/usetoast";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "created"): void;
}>();

const api = useApi();
const toast = useToast();
const loading = ref(false);

const form = reactive({ fullName: "", email: "", password: "" });

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.fullName = "";
      form.email = "";
      form.password = "";
    }
  },
);

async function handleSubmit() {
  if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
    toast.add({
      severity: "warn",
      summary: "Thiếu thông tin",
      detail: "Vui lòng điền đầy đủ thông tin",
      life: 3000,
    });
    return;
  }
  loading.value = true;
  try {
    await api.post("/api/auth/register", {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã tạo người dùng mới",
      life: 3000,
    });
    emit("update:visible", false);
    emit("created");
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
