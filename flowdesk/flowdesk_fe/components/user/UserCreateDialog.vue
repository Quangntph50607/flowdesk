<template>
  <Dialog
    :visible="visible"
    header="Thêm người dùng"
    modal
    style="width: 560px"
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
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Số điện thoại</label>
          <InputText v-model="form.phone" fluid placeholder="0901234567" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Ngày sinh</label>
          <InputText v-model="form.dateOfBirth" type="date" fluid />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Địa chỉ</label>
        <InputText
          v-model="form.address"
          fluid
          placeholder="Số nhà, phường/xã, tỉnh/thành"
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
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "created"): void;
}>();

const api = useApi();
const toast = useAppToast();
const loading = ref(false);

const form = reactive({
  fullName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  dateOfBirth: "",
});

const PHONE_PATTERN = /^0\d{9,10}$/;

function resetForm() {
  form.fullName = "";
  form.email = "";
  form.password = "";
  form.phone = "";
  form.address = "";
  form.dateOfBirth = "";
}

function normalizePhone(phone: string) {
  let normalized = phone.trim().replace(/[\s.\-()]/g, "");
  if (normalized.startsWith("+84")) {
    normalized = `0${normalized.slice(3)}`;
  } else if (normalized.startsWith("84")) {
    normalized = `0${normalized.slice(2)}`;
  }
  return normalized;
}

function isValidPhone(phone: string) {
  if (!phone.trim()) return true;
  return PHONE_PATTERN.test(normalizePhone(phone));
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) resetForm();
  },
);

async function handleSubmit() {
  if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
    toast.add({
      severity: "warn",
      summary: "Thiếu thông tin",
      detail: "Vui lòng điền đầy đủ họ tên, email và mật khẩu",
      life: 3000,
    });
    return;
  }
  if (!isValidPhone(form.phone)) {
    toast.add({
      severity: "warn",
      summary: "Số điện thoại chưa hợp lệ",
      detail: "SĐT phải có 10-11 số, bắt đầu bằng 0 hoặc +84",
      life: 3000,
    });
    return;
  }
  loading.value = true;
  try {
    await api.post("/api/auth/register", {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      dateOfBirth: form.dateOfBirth || null,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã tạo người dùng mới",
      life: 3000,
    });
    resetForm();
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
