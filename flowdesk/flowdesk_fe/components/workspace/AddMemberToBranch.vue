<template>
  <Dialog
    :visible="visible"
    header="Thêm nhân viên vào chi nhánh"
    modal
    class="w-[500px] max-w-[calc(100vw-2rem)]"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex gap-2 mb-4 pt-2">
      <button
        :class="[
          'cursor-pointer rounded-lg border px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-all duration-150',
          tab === 'new'
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-transparent',
        ]"
        @click="tab = 'new'"
      >
        Tạo tài khoản mới
      </button>
      <button
        :class="[
          'cursor-pointer rounded-lg border px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-all duration-150',
          tab === 'existing'
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-transparent',
        ]"
        @click="tab = 'existing'"
      >
        Chọn từ workspace
      </button>
    </div>

    <!-- Tab: Tạo mới -->
    <div v-if="tab === 'new'" class="flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Họ và tên <span class="text-red-500">*</span></label
        >
        <InputText
          v-model="newForm.fullName"
          placeholder="Nguyễn Văn A"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Email <span class="text-red-500">*</span></label
        >
        <InputText
          v-model="newForm.email"
          placeholder="email@example.com"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Mật khẩu <span class="text-red-500">*</span></label
        >
        <InputText
          v-model="newForm.password"
          type="password"
          placeholder="••••••••"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1" v-if="isOwner">
        <label class="text-sm font-medium">Vai trò</label>
        <Select
          v-model="newForm.roleCode"
          :options="roleOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
    </div>

    <!-- Tab: Chọn từ workspace tổng -->
    <div v-if="tab === 'existing'" class="flex flex-col gap-3">
      <p class="text-sm text-slate-500">
        Chọn thành viên từ workspace tổng
        <strong>{{ parentWorkspaceName }}</strong> chưa có trong chi nhánh này.
      </p>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Chọn người dùng</label>
        <Select
          v-model="existingForm.userId"
          :options="availableMembers"
          option-label="fullName"
          option-value="userId"
          placeholder="Tìm và chọn..."
          filter
          :loading="loadingAvailable"
          @filter="handleFilter"
          fluid
        >
          <template #option="{ option }">
            <div class="flex flex-col py-1">
              <span class="text-sm font-medium">{{ option.fullName }}</span>
              <span class="text-xs text-slate-400"
                >{{ option.email }} · {{ option.roleCode }}</span
              >
            </div>
          </template>
        </Select>
      </div>
      <div class="flex flex-col gap-1" v-if="isOwner">
        <label class="text-sm font-medium">Vai trò trong chi nhánh</label>
        <Select
          v-model="existingForm.roleCode"
          :options="roleOptions"
          option-label="label"
          option-value="value"
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
        label="Thêm"
        :loading="loading"
        class="!px-5 !text-sm"
        @click="handleSubmit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">

const props = defineProps<{
  visible: boolean;
  workspaceId: string | number;
  branchId: string | number;
  parentWorkspaceName: string;
  isOwner: boolean;
  availableMembers: {
    userId: number;
    fullName: string;
    email: string;
    roleCode?: string;
  }[];
  loadingAvailable?: boolean;
}>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "added"): void;
  (e: "filter", search: string): void;
}>();

const api = useApi();
const toast = useAppToast();
const loading = ref(false);
const tab = ref<"new" | "existing">("new");

const newForm = reactive({
  fullName: "",
  email: "",
  password: "",
  roleCode: "AGENT",
});
const existingForm = reactive({
  userId: null as number | null,
  roleCode: "AGENT",
});

const roleOptions = computed(() =>
  props.isOwner
    ? [
        { label: "Admin", value: "ADMIN" },
        { label: "Nhân viên (Agent)", value: "AGENT" },
      ]
    : [{ label: "Nhân viên (Agent)", value: "AGENT" }],
);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      tab.value = "new";
      newForm.fullName = "";
      newForm.email = "";
      newForm.password = "";
      newForm.roleCode = "AGENT";
      existingForm.userId = null;
      existingForm.roleCode = "AGENT";
    }
  },
);

let filterTimer: ReturnType<typeof setTimeout> | undefined;
function handleFilter(event: any) {
  if (filterTimer) clearTimeout(filterTimer);
  const search = event?.value ?? event?.filter ?? "";
  filterTimer = setTimeout(() => emit("filter", search), 400);
}

async function handleSubmit() {
  loading.value = true;
  try {
    let userId: number;
    let roleCode: string;

    if (tab.value === "new") {
      if (
        !newForm.fullName.trim() ||
        !newForm.email.trim() ||
        !newForm.password.trim()
      ) {
        toast.add({
          severity: "warn",
          summary: "Thiếu thông tin",
          detail: "Vui lòng điền đầy đủ",
          life: 3000,
        });
        return;
      }
      const res = await api.post("/api/auth/register", {
        fullName: newForm.fullName,
        email: newForm.email,
        password: newForm.password,
      });
      userId = res.data.data?.id ?? res.data.data?.userId;
      roleCode = props.isOwner ? newForm.roleCode : "AGENT";
    } else {
      if (!existingForm.userId) {
        toast.add({
          severity: "warn",
          summary: "Chưa chọn",
          detail: "Vui lòng chọn người dùng",
          life: 3000,
        });
        return;
      }
      userId = existingForm.userId;
      roleCode = props.isOwner ? existingForm.roleCode : "AGENT";
    }

    await api.post(`/api/workspaces/${props.branchId}/members`, {
      userId,
      roleCode,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã thêm nhân viên vào chi nhánh",
      life: 3000,
    });
    emit("update:visible", false);
    emit("added");
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
