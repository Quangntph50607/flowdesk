<template>
  <div class="fd-page">
    <!-- Header -->
    <AppPageHeader
      :title="branch?.name ?? 'Chi nhánh'"
      :subtitle="`Thuộc: ${parentWorkspaceName}`"
      :breadcrumb="`Workspaces / ${parentWorkspaceName}`"
      back
    >
      <Button
        v-if="canManage"
        label="Sửa"
        icon="pi pi-pencil"
        severity="secondary"
        outlined
        size="small"
        @click="openEditBranch"
      />
    </AppPageHeader>

    <!-- Info row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" v-if="branch">
      <div class="fd-info-card">
        <span class="fd-info-label">Slug</span>
        <span class="fd-info-value">{{ branch.slug ?? "—" }}</span>
      </div>
      <div class="fd-info-card">
        <span class="fd-info-label">Cấp độ</span>
        <span class="fd-info-value"
          ><Tag value="Chi nhánh" severity="warn"
        /></span>
      </div>
      <div class="fd-info-card">
        <span class="fd-info-label">Trạng thái</span>
        <span class="fd-info-value">
          <Tag
            :value="branch.isActive ? 'Hoạt động' : 'Đã tắt'"
            :severity="branch.isActive ? 'success' : 'secondary'"
          />
        </span>
      </div>
    </div>

    <!-- ======================== NHÂN VIÊN CHI NHÁNH ======================== -->
    <Card>
      <template #header>
        <div class="flex items-center justify-between px-6 pt-5 pb-0">
          <div>
            <h2 class="text-base font-semibold" style="color: #0f172a">
              Nhân viên chi nhánh
            </h2>
            <p class="text-sm mt-0.5" style="color: #64748b">
              Danh sách nhân viên được phân bổ vào chi nhánh này
            </p>
          </div>
          <Button
            v-if="canManage"
            label="Thêm nhân viên"
            icon="pi pi-user-plus"
            size="small"
            @click="openAddMember"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="members"
          :loading="loadingMembers"
          data-key="id"
          striped-rows
        >
          <Column header="Nhân viên">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div
                  class="flex items-center justify-center rounded-full font-semibold text-xs shrink-0"
                  style="
                    width: 34px;
                    height: 34px;
                    background-color: #e2e8f0;
                    color: #475569;
                  "
                >
                  {{ data.fullName?.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-medium" style="color: #0f172a">
                    {{ data.fullName }}
                  </p>
                  <p class="text-xs" style="color: #94a3b8">{{ data.email }}</p>
                </div>
              </div>
            </template>
          </Column>
          <Column header="Vai trò" style="width: 130px">
            <template #body="{ data }">
              <Tag
                :value="data.roleName ?? data.roleCode"
                :severity="data.roleCode === 'ADMIN' ? 'warn' : 'info'"
              />
            </template>
          </Column>
          <Column header="Trạng thái" style="width: 150px">
            <template #body="{ data }">
              <Tag
                :value="data.isActive ? 'Hoạt động' : 'Ngưng hoạt động'"
                :severity="data.isActive ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column v-if="canManage" header="Hành động" style="width: 100px">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <ToggleSwitch
                  v-model="data.isActive"
                  @update:model-value="toggleMember(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  v-tooltip.top="'Xóa khỏi chi nhánh'"
                  @click="confirmRemoveMember(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-8 text-surface-400">
              <i class="pi pi-users text-3xl mb-2 block" />
              Chưa có nhân viên nào
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- ======================== DIALOG: Sửa chi nhánh ======================== -->
    <Dialog
      v-model:visible="showEditDialog"
      header="Cập nhật chi nhánh"
      modal
      style="width: 460px"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Tên chi nhánh <span class="text-red-500">*</span></label
          >
          <InputText v-model="editForm.name" fluid />
        </div>
      </div>
      <template #footer>
        <Button
          label="Hủy"
          severity="secondary"
          text
          @click="showEditDialog = false"
        />
        <Button
          label="Cập nhật"
          :loading="submittingEdit"
          @click="handleEditBranch"
        />
      </template>
    </Dialog>

    <!-- ======================== DIALOG: Thêm nhân viên ======================== -->
    <Dialog
      v-model:visible="showAddMemberDialog"
      header="Thêm nhân viên vào chi nhánh"
      modal
      style="width: 500px"
    >
      <!-- Tab switcher -->
      <div class="flex gap-2 mb-4 pt-2">
        <button
          :class="['fd-tab', addTab === 'new' ? 'fd-tab--active' : '']"
          @click="addTab = 'new'"
        >
          Tạo tài khoản mới
        </button>
        <button
          :class="['fd-tab', addTab === 'existing' ? 'fd-tab--active' : '']"
          @click="addTab = 'existing'"
        >
          Chọn từ workspace
        </button>
      </div>

      <!-- Tab: Tạo mới -->
      <div v-if="addTab === 'new'" class="flex flex-col gap-3">
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
      <div v-if="addTab === 'existing'" class="flex flex-col gap-3">
        <p class="text-sm" style="color: #64748b">
          Chọn thành viên từ workspace tổng
          <strong>{{ parentWorkspaceName }}</strong> chưa có trong chi nhánh
          này.
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
            @filter="handleAvailableMembersFilter"
            :loading="loadingAvailable"
            fluid
          >
            <template #option="{ option }">
              <div class="flex flex-col py-1">
                <span class="text-sm font-medium">{{ option.fullName }}</span>
                <span class="text-xs" style="color: #94a3b8"
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
          @click="showAddMemberDialog = false"
        />
        <Button label="Thêm" :loading="addingMember" @click="handleAddMember" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const api = useApi();
const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();

const workspaceId = computed(() => route.params.id as string);
const branchId = computed(() => route.params.branchId as string);

// ── State ────────────────────────────────────────────────────────────
const branch = ref<any>(null);
const parentWorkspaceName = ref("...");
const members = ref<any[]>([]);
const loadingMembers = ref(false);

// Quyền: SUPER_ADMIN hoặc OWNER/ADMIN của workspace tổng cha
const isOwner = computed(() => {
  if (authStore.isSuperAdmin) return true;
  const mine = authStore.currentUser?.workspaces?.find(
    (w: any) =>
      w.workspaceId === Number(workspaceId.value) && w.parentId === null,
  );
  return mine?.roleCode === "OWNER";
});

const canManage = computed(() => {
  if (authStore.isSuperAdmin) return true;
  const mine = authStore.currentUser?.workspaces?.find(
    (w: any) =>
      w.workspaceId === Number(workspaceId.value) && w.parentId === null,
  );
  return mine?.roleCode === "OWNER" || mine?.roleCode === "ADMIN";
});

// Role options — OWNER chọn được ADMIN/AGENT, ADMIN chỉ AGENT
const roleOptions = computed(() =>
  isOwner.value
    ? [
        { label: "Admin", value: "ADMIN" },
        { label: "Nhân viên (Agent)", value: "AGENT" },
      ]
    : [{ label: "Nhân viên (Agent)", value: "AGENT" }],
);

// ── Edit branch ──────────────────────────────────────────────────────
const showEditDialog = ref(false);
const submittingEdit = ref(false);
const editForm = reactive({ name: "" });

function openEditBranch() {
  editForm.name = branch.value?.name ?? "";
  showEditDialog.value = true;
}

async function handleEditBranch() {
  if (!editForm.name.trim()) return;
  submittingEdit.value = true;
  try {
    const res = await api.put(
      `/api/workspaces/${workspaceId.value}/branches/${branchId.value}`,
      { name: editForm.name },
    );
    branch.value = {
      ...branch.value,
      name: res.data.data?.name ?? editForm.name,
    };
    showEditDialog.value = false;
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã cập nhật chi nhánh",
      life: 3000,
    });
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: err.response?.data?.message ?? "Có lỗi xảy ra",
      life: 3000,
    });
  } finally {
    submittingEdit.value = false;
  }
}

// ── Add member ───────────────────────────────────────────────────────
const showAddMemberDialog = ref(false);
const addTab = ref<"new" | "existing">("new");
const addingMember = ref(false);
const loadingAvailable = ref(false);

// Tab tạo mới
const newForm = reactive({
  fullName: "",
  email: "",
  password: "",
  roleCode: "AGENT",
});

// Tab chọn có sẵn
const existingForm = reactive({
  userId: null as number | null,
  roleCode: "AGENT",
});
const availableMembers = ref<any[]>([]);
let availableMembersSearchTimer: ReturnType<typeof setTimeout> | undefined;

async function openAddMember() {
  addTab.value = "new";
  newForm.fullName = "";
  newForm.email = "";
  newForm.password = "";
  newForm.roleCode = "AGENT";
  existingForm.userId = null;
  existingForm.roleCode = "AGENT";
  showAddMemberDialog.value = true;
  await fetchAvailableMembers();
}

// Fetch members của workspace tổng → filter bỏ những người đã ở chi nhánh này
async function fetchAvailableMembers(search = "") {
  loadingAvailable.value = true;
  try {
    const res = await api.get(`/api/workspaces/${workspaceId.value}/members`, {
      params: { search: search.trim() || undefined },
    });
    const parentMembers = res.data.data ?? [];
    const currentMemberIds = new Set(members.value.map((m: any) => m.userId));
    availableMembers.value = parentMembers
      .filter((m: any) => !currentMemberIds.has(m.userId))
      .map((m: any) => ({
        userId: m.userId,
        fullName: m.fullName,
        email: m.email,
        roleCode: m.roleCode,
      }));
  } catch {
    availableMembers.value = [];
  } finally {
    loadingAvailable.value = false;
  }
}

function handleAvailableMembersFilter(event: any) {
  if (availableMembersSearchTimer) clearTimeout(availableMembersSearchTimer);
  const search = event?.value ?? event?.filter ?? "";
  availableMembersSearchTimer = setTimeout(
    () => fetchAvailableMembers(search),
    1000,
  );
}

async function handleAddMember() {
  addingMember.value = true;
  try {
    let userId: number;
    let roleCode: string;

    if (addTab.value === "new") {
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
      // Tạo account mới
      const regRes = await api.post("/api/auth/register", {
        fullName: newForm.fullName,
        email: newForm.email,
        password: newForm.password,
      });
      userId = regRes.data.data?.id ?? regRes.data.data?.userId;
      roleCode = isOwner.value ? newForm.roleCode : "AGENT";
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
      roleCode = isOwner.value ? existingForm.roleCode : "AGENT";
    }

    // Add vào chi nhánh
    await api.post(`/api/workspaces/${branchId.value}/members`, {
      userId,
      roleCode,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã thêm nhân viên vào chi nhánh",
      life: 3000,
    });
    showAddMemberDialog.value = false;
    fetchMembers();
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: err.response?.data?.message ?? "Có lỗi xảy ra",
      life: 3000,
    });
  } finally {
    addingMember.value = false;
  }
}

async function toggleMember(member: any) {
  try {
    await api.patch(
      `/api/workspaces/${branchId.value}/members/${member.id}/toggle-active`,
    );
    fetchMembers();
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể cập nhật trạng thái",
      life: 3000,
    });
  }
}

function confirmRemoveMember(member: any) {
  confirm.require({
    message: `Xóa "${member.fullName}" khỏi chi nhánh này?`,
    header: "Xác nhận",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Hủy",
    acceptLabel: "Xóa",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await api.delete(
          `/api/workspaces/${branchId.value}/members/${member.id}`,
        );
        toast.add({
          severity: "success",
          summary: "Đã xóa",
          detail: member.fullName,
          life: 3000,
        });
        fetchMembers();
      } catch {
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xóa nhân viên",
          life: 3000,
        });
      }
    },
  });
}

// ── Fetch ─────────────────────────────────────────────────────────────
async function fetchBranch() {
  try {
    const res = await api.get(`/api/workspaces/${branchId.value}`);
    branch.value = res.data.data;
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải chi nhánh",
      life: 3000,
    });
  }
}

async function fetchParentWorkspace() {
  try {
    const url = authStore.isSuperAdmin
      ? `/api/admin/workspaces/${workspaceId.value}`
      : `/api/workspaces/${workspaceId.value}`;
    const res = await api.get(url);
    parentWorkspaceName.value = res.data.data?.name ?? "Workspace tổng";
  } catch {
    parentWorkspaceName.value = "Workspace tổng";
  }
}

async function fetchMembers() {
  loadingMembers.value = true;
  try {
    const res = await api.get(`/api/workspaces/${branchId.value}/members`);
    members.value = res.data.data ?? [];
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải nhân viên",
      life: 3000,
    });
  } finally {
    loadingMembers.value = false;
  }
}

onMounted(async () => {
  if (!authStore.currentUser) await authStore.fetchMe();
  await Promise.all([fetchBranch(), fetchParentWorkspace(), fetchMembers()]);
});
</script>

<style scoped>
.fd-info-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
.fd-info-label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.fd-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
}
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
  color: #ffffff;
  border-color: #0f172a;
}
</style>
