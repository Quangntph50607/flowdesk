<template>
  <Dialog
    :visible="visible"
    header="Cập nhật người dùng"
    modal
    style="width: 560px"
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
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Số điện thoại</label>
          <InputText v-model="form.phone" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Ngày sinh</label>
          <DatePicker
            v-model="form.dateOfBirth"
            dateFormat="dd/mm/yy"
            placeholder="dd/mm/yyyy"
            :maxDate="new Date()"
            showIcon
            iconDisplay="input"
            fluid
          />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Địa chỉ</label>
        <InputText v-model="form.address" fluid />
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
type EditableUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
};

const props = defineProps<{
  visible: boolean;
  user: EditableUser | null;
}>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "updated"): void;
}>();

const api = useApi();
const toast = useAppToast();
const loading = ref(false);

const form = reactive({
  fullName: "",
  email: "",
  phone: "",
  address: "",
  dateOfBirth: "",
});

const PHONE_PATTERN = /^0\d{9,10}$/;

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

function toDatePayload(value: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value;
}

watch(
  () => props.user,
  (val) => {
    if (val) {
      form.fullName = val.fullName;
      form.email = val.email;
      form.phone = val.phone ?? "";
      form.address = val.address ?? "";
      form.dateOfBirth = val.dateOfBirth ?? "";
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.user) return;
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
    await api.patch(`/api/admin/users/${props.user.id}`, {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      dateOfBirth: toDatePayload(form.dateOfBirth),
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
