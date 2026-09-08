<template>
  <Dialog
    :visible="visible"
    header="Thêm thành viên"
    modal
    style="width: 500px"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="flex gap-2 mb-4 pt-2">
      <button
        :class="['fd-tab', tab === 'new' ? 'fd-tab--active' : '']"
        @click="tab = 'new'"
      >
        Tạo tài khoản mới
      </button>
      <button
        :class="['fd-tab', tab === 'existing' ? 'fd-tab--active' : '']"
        @click="tab = 'existing'"
      >
        Chọn có sẵn
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
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Vai trò <span class="text-red-500">*</span></label
        >
        <Select
          v-model="newForm.roleCode"
          :options="roleOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>
      <div class="flex flex-col gap-1" v-if="branches && branches.length">
        <label class="text-sm font-medium">Chi nhánh</label>
        <Select
          v-model="newForm.branchId"
          :options="[{ id: null, name: '— Workspace tổng' }, ...branches]"
          option-label="name"
          option-value="id"
          placeholder="Chọn chi nhánh..."
          fluid
        />
      </div>
    </div>

    <!-- Tab: Chọn có sẵn -->
    <div v-if="tab === 'existing'" class="flex flex-col gap-3">
      <!-- Chọn chi nhánh trước để filter danh sách user -->
      <div class="flex flex-col gap-1" v-if="branches && branches.length">
        <label class="text-sm font-medium">Chi nhánh</label>
        <Select
          v-model="existingForm.branchId"
          :options="[{ id: null, name: '— Workspace tổng' }, ...branches]"
          option-label="name"
          option-value="id"
          placeholder="Chọn chi nhánh..."
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Chọn người dùng</label>
        <Select
          v-model="existingForm.userId"
          :options="filteredUsers"
          option-label="fullName"
          option-value="userId"
          placeholder="Tìm và chọn..."
          filter
          fluid
        >
          <template #option="{ option }">
            <div class="flex flex-col py-0.5">
              <span class="text-sm font-medium">{{ option.fullName }}</span>
              <span class="text-xs" style="color: #94a3b8">{{
                option.email
              }}</span>
            </div>
          </template>
          <template #empty>
            <div class="text-sm text-center py-2" style="color: #94a3b8">
              Không có người dùng khả dụng
            </div>
          </template>
        </Select>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium"
          >Vai trò <span class="text-red-500">*</span></label
        >
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
import { useToast } from "primevue/usetoast";

const props = defineProps<{
  visible: boolean;
  workspaceId: string | number;
  isOwner: boolean;
  branches?: { id: number; name: string }[];
  // Toàn bộ member workspace tổng + chi nhánh (từ /all-members)
  allMembers?: {
    userId: number;
    fullName: string;
    email: string;
    branchId?: number | null;
    workspaceId?: number;
  }[];
}>();
const emit = defineEmits<{
  (e: "update:visible", val: boolean): void;
  (e: "added"): void;
}>();

const api = useApi();
const toast = useToast();
const loading = ref(false);
const tab = ref<"new" | "existing">("new");

const newForm = reactive({
  fullName: "",
  email: "",
  password: "",
  roleCode: "AGENT",
  branchId: null as number | null,
});
const existingForm = reactive({
  userId: null as number | null,
  roleCode: "AGENT",
  branchId: null as number | null,
});

const roleOptions = computed(() =>
  props.isOwner
    ? [
        { label: "Quản trị viên (Admin)", value: "ADMIN" },
        { label: "Nhân viên (Agent)", value: "AGENT" },
      ]
    : [{ label: "Nhân viên (Agent)", value: "AGENT" }],
);

// Danh sách user để chọn — dedupe theo userId, lọc theo chi nhánh được chọn
const filteredUsers = computed(() => {
  const members = props.allMembers ?? [];
  const targetBranchId = existingForm.branchId; // null = workspace tổng

  // userId nào đã có trong target (workspace tổng hoặc chi nhánh được chọn)
  const alreadyIn = new Set(
    members
      .filter(
        (m) =>
          targetBranchId === null
            ? m.branchId == null // đã là member workspace tổng
            : m.branchId === targetBranchId, // đã là member chi nhánh đó
      )
      .map((m) => m.userId),
  );

  // Dedupe toàn bộ member theo userId, bỏ người đã có trong target
  const seen = new Set<number>();
  return members
    .filter((m) => {
      if (seen.has(m.userId)) return false;
      seen.add(m.userId);
      return !alreadyIn.has(m.userId);
    })
    .map((m) => ({ userId: m.userId, fullName: m.fullName, email: m.email }));
});

// Reset userId khi đổi chi nhánh vì list thay đổi
watch(
  () => existingForm.branchId,
  () => {
    existingForm.userId = null;
  },
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
      newForm.branchId = null;
      existingForm.userId = null;
      existingForm.roleCode = "AGENT";
      existingForm.branchId = null;
    }
  },
);

async function handleSubmit() {
  loading.value = true;
  try {
    let userId: number;
    let roleCode: string;
    let targetId: string | number;

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
      roleCode = newForm.roleCode;
      targetId = newForm.branchId ?? props.workspaceId;
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
      roleCode = existingForm.roleCode;
      targetId = existingForm.branchId ?? props.workspaceId;
    }

    await api.post(`/api/workspaces/${targetId}/members`, { userId, roleCode });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã thêm thành viên",
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

<style scoped>
.fd-tab {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  border: 1px solid #e2e8f0;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}
.fd-tab--active {
  background: #0f172a;
  color: #fff;
  border-color: #0f172a;
}
</style>
