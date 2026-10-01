<template>
  <Dialog
    :visible="visible"
    header="Thông tin cá nhân"
    modal
    style="width: 560px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4 pt-2">
      <div class="flex flex-col items-center gap-2">
        <button
          type="button"
          class="group relative h-24 w-24 overflow-hidden rounded-full bg-slate-100"
          :disabled="uploadingAvatar"
          @click="avatarInput?.click()"
        >
          <img
            v-if="form.avatarUrl && !avatarLoadFailed"
            :src="avatarPreviewUrl"
            alt=""
            class="h-full w-full object-cover"
            @error="avatarLoadFailed = true"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-xl font-bold text-slate-500"
          >
            {{ avatarInitial }}
          </div>
          <span
            class="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/0 opacity-0 transition-opacity group-hover:bg-slate-950/35 group-hover:opacity-100"
          >
            <i
              class="pi text-white text-[18px]"
              :class="uploadingAvatar ? 'pi-spin pi-spinner' : 'pi-camera'"
            />
          </span>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleAvatarChange"
          />
        </button>
        <div class="h-7">
          <Button
            v-if="form.avatarUrl"
            label="Xóa ảnh"
            icon="pi pi-times"
            text
            size="small"
            severity="secondary"
            @click="form.avatarUrl = ''"
          />
        </div>
      </div>

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
const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "updated"): void;
}>();

const api = useApi();
const authStore = useAuthStore();
const toast = useAppToast();
const { uploadAvatar } = useFileUpload();

const loading = ref(false);
const uploadingAvatar = ref(false);
const avatarLoadFailed = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  fullName: "",
  email: "",
  avatarUrl: "",
  phone: "",
  address: "",
  dateOfBirth: "" as string | Date | null,
});

const avatarInitial = computed(
  () => form.fullName?.charAt(0).toUpperCase() || "U",
);
const avatarPreviewUrl = computed(() => form.avatarUrl);

const PHONE_PATTERN = /^0\d{9,10}$/;

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await authStore.fetchMe();
      fillForm();
    }
  },
);

watch(
  () => authStore.currentUser,
  () => {
    if (props.visible) fillForm();
  },
);

function fillForm() {
  const user = authStore.currentUser;
  form.fullName = user?.fullName ?? "";
  form.email = user?.email ?? "";
  form.avatarUrl = user?.avatarUrl ?? "";
  form.phone = user?.phone ?? "";
  form.address = user?.address ?? "";
  form.dateOfBirth = user?.dateOfBirth ?? "";
  avatarLoadFailed.value = false;
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

async function handleAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploadingAvatar.value = true;
  try {
    const uploaded = await uploadAvatar(file);
    if (!uploaded) throw new Error();
    form.avatarUrl = uploaded.fileUrl;
    avatarLoadFailed.value = false;
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải ảnh đại diện",
      life: 3000,
    });
  } finally {
    uploadingAvatar.value = false;
    if (avatarInput.value) avatarInput.value.value = "";
  }
}

async function handleSubmit() {
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
    await api.patch("/api/me", {
      fullName: form.fullName.trim(),
      avatarUrl: form.avatarUrl || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      dateOfBirth: toDatePayload(form.dateOfBirth),
    });
    await authStore.fetchMe();
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã cập nhật thông tin cá nhân",
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
