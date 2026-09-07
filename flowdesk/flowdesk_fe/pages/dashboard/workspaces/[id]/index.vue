<template>
  <div class="fd-page">
    <AppPageHeader
      :title="workspace?.name ?? 'Workspace'"
      :subtitle="`Slug: ${workspace?.slug ?? '...'}`"
      breadcrumb="Workspaces"
      back
    >
      <Button
        v-if="canManage"
        label="Sửa"
        icon="pi pi-pencil"
        severity="secondary"
        outlined
        size="small"
        @click="openEditWorkspace"
      />
    </AppPageHeader>

    <!-- Info row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" v-if="workspace">
      <div class="fd-info-card">
        <span class="fd-info-label">Chủ sở hữu</span>
        <span class="fd-info-value">{{ workspace.ownerName ?? "—" }}</span>
      </div>
      <div class="fd-info-card">
        <span class="fd-info-label">Cấp độ</span>
        <span class="fd-info-value"
          ><Tag value="Workspace tổng" severity="info"
        /></span>
      </div>
      <div class="fd-info-card">
        <span class="fd-info-label">Trạng thái</span>
        <span class="fd-info-value">
          <Tag
            :value="workspace.isActive ? 'Hoạt động' : 'Đã tắt'"
            :severity="workspace.isActive ? 'success' : 'secondary'"
          />
        </span>
      </div>
    </div>

    <!-- CHI NHÁNH -->
    <Card class="mb-5">
      <template #header>
        <div class="flex items-center justify-between px-6 pt-5 pb-0">
          <div>
            <h2 class="text-base font-semibold" style="color: #0f172a">
              Chi nhánh
            </h2>
            <p class="text-sm mt-0.5" style="color: #64748b">
              Danh sách chi nhánh trực thuộc workspace này
            </p>
          </div>
          <Button
            v-if="canManage"
            label="Tạo chi nhánh"
            icon="pi pi-plus"
            size="small"
            @click="openCreateBranch"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="branches"
          :loading="loadingBranches"
          data-key="id"
          striped-rows
        >
          <Column field="name" header="Tên chi nhánh" sortable />
          <Column field="slug" header="Slug" />
          <Column header="Trạng thái" style="width: 130px">
            <template #body="{ data }">
              <Tag
                :value="data.isActive ? 'Hoạt động' : 'Đã tắt'"
                :severity="data.isActive ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column header="Hành động" style="width: 140px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  size="small"
                  severity="info"
                  v-tooltip.top="'Xem chi tiết'"
                  @click="
                    navigateTo(
                      `/dashboard/workspaces/${workspaceId}/branches/${data.id}`,
                    )
                  "
                />
                <template v-if="canManage">
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    severity="warn"
                    v-tooltip.top="'Sửa'"
                    @click="openEditBranch(data)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    v-tooltip.top="'Xóa'"
                    @click="confirmDeleteBranch(data)"
                  />
                </template>
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-8 text-surface-400">
              <i class="pi pi-sitemap text-3xl mb-2 block" />Chưa có chi nhánh
              nào
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- THÀNH VIÊN -->
    <Card>
      <template #header>
        <div class="flex items-center justify-between px-6 pt-5 pb-0">
          <div>
            <h2 class="text-base font-semibold" style="color: #0f172a">
              Thành viên
            </h2>
            <p class="text-sm mt-0.5" style="color: #64748b">
              Tất cả thành viên thuộc workspace và các chi nhánh
            </p>
          </div>
          <Button
            v-if="canManage"
            label="Thêm thành viên"
            icon="pi pi-user-plus"
            size="small"
            @click="openAddMember"
          />
        </div>
      </template>
      <template #content>
        <DataTable
          :value="allMembers"
          :loading="loadingMembers"
          data-key="uniqueKey"
          striped-rows
        >
          <Column header="Thành viên">
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
          <Column header="Vai trò" style="width: 150px">
            <template #body="{ data }">
              <Tag
                :value="data.roleName ?? data.roleCode"
                :severity="
                  data.roleCode === 'OWNER'
                    ? 'contrast'
                    : data.roleCode === 'ADMIN'
                      ? 'warn'
                      : 'info'
                "
              />
            </template>
          </Column>
          <Column header="Chi nhánh" style="width: 200px">
            <template #body="{ data }">
              <span
                v-if="data.branchName"
                class="text-sm"
                style="color: #0f172a"
                >{{ data.branchName }}</span
              >
              <span v-else class="text-xs" style="color: #94a3b8"
                >— Workspace tổng</span
              >
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
          <Column v-if="canManage" header="Hành động" style="width: 120px">
            <template #body="{ data }">
              <div
                class="flex items-center gap-1"
                v-if="data.roleCode !== 'OWNER'"
              >
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
                  v-tooltip.top="'Xóa'"
                  @click="confirmRemoveMember(data)"
                />
              </div>
              <span v-else class="text-xs" style="color: #94a3b8">Owner</span>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-8 text-surface-400">
              Chưa có thành viên
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- DIALOG: Tạo / Sửa chi nhánh -->
    <Dialog
      v-model:visible="showBranchDialog"
      :header="editingBranch ? 'Cập nhật chi nhánh' : 'Tạo chi nhánh mới'"
      modal
      style="width: 460px"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Tên chi nhánh <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="branchForm.name"
            placeholder="Nhập tên chi nhánh"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Slug <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="branchForm.slug"
            placeholder="ten-chi-nhanh"
            fluid
            :disabled="!!editingBranch"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Hủy"
          severity="secondary"
          text
          @click="closeBranchDialog"
        />
        <Button
          :label="editingBranch ? 'Cập nhật' : 'Tạo'"
          :loading="submittingBranch"
          @click="handleBranchSubmit"
        />
      </template>
    </Dialog>

    <!-- DIALOG: Sửa workspace -->
    <Dialog
      v-model:visible="showEditWorkspace"
      header="Cập nhật workspace"
      modal
      style="width: 460px"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Tên workspace <span class="text-red-500">*</span></label
          >
          <InputText v-model="wsForm.name" fluid />
        </div>
      </div>
      <template #footer>
        <Button
          label="Hủy"
          severity="secondary"
          text
          @click="showEditWorkspace = false"
        />
        <Button
          label="Cập nhật"
          :loading="submittingWs"
          @click="handleUpdateWorkspace"
        />
      </template>
    </Dialog>

    <!-- DIALOG: Thêm thành viên -->
    <Dialog
      v-model:visible="showAddMemberDialog"
      header="Thêm thành viên"
      modal
      style="width: 500px"
    >
      <div class="flex gap-2 mb-4 pt-2">
        <button
          :class="['fd-tab', addMemberTab === 'new' ? 'fd-tab--active' : '']"
          @click="addMemberTab = 'new'"
        >
          Tạo tài khoản mới
        </button>
        <button
          :class="[
            'fd-tab',
            addMemberTab === 'existing' ? 'fd-tab--active' : '',
          ]"
          @click="addMemberTab = 'existing'"
        >
          Chọn có sẵn
        </button>
      </div>

      <!-- Tab: Tạo mới -->
      <div v-if="addMemberTab === 'new'" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Họ và tên <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="newMemberForm.fullName"
            placeholder="Nguyễn Văn A"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Email <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="newMemberForm.email"
            placeholder="email@example.com"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Mật khẩu <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="newMemberForm.password"
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
            v-model="newMemberForm.roleCode"
            :options="addRoleOptions"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Chi nhánh</label>
          <Select
            v-model="newMemberForm.branchId"
            :options="[{ id: null, name: '— Workspace tổng' }, ...branches]"
            option-label="name"
            option-value="id"
            placeholder="Chọn chi nhánh..."
            fluid
          />
        </div>
      </div>

      <!-- Tab: Chọn có sẵn -->
      <div v-if="addMemberTab === 'existing'" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Chọn người dùng</label>
          <Select
            v-model="existingMemberForm.userId"
            :options="availableUsersForWorkspace"
            option-label="fullName"
            option-value="userId"
            placeholder="Tìm và chọn..."
            filter
            @filter="handleAvailableUsersFilter"
            fluid
          >
            <template #option="{ option }">
              <div class="flex flex-col">
                <span class="text-sm font-medium">{{ option.fullName }}</span>
                <span class="text-xs" style="color: #94a3b8">{{
                  option.email
                }}</span>
              </div>
            </template>
          </Select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Vai trò <span class="text-red-500">*</span></label
          >
          <Select
            v-model="existingMemberForm.roleCode"
            :options="addRoleOptions"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Chi nhánh</label>
          <Select
            v-model="existingMemberForm.branchId"
            :options="[{ id: null, name: '— Workspace tổng' }, ...branches]"
            option-label="name"
            option-value="id"
            placeholder="Chọn chi nhánh..."
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

const workspace = ref<any>(null);
const branches = ref<any[]>([]);
const allMembers = ref<any[]>([]);
const loadingBranches = ref(false);
const loadingMembers = ref(false);

const canManage = computed(() => {
  if (authStore.isSuperAdmin) return true;
  const mine = authStore.currentUser?.workspaces?.find(
    (w: any) =>
      w.workspaceId === Number(workspaceId.value) && w.parentId === null,
  );
  return mine?.roleCode === "OWNER";
});

// ── Edit workspace ──────────────────────────────────────────────────
const showEditWorkspace = ref(false);
const submittingWs = ref(false);
const wsForm = reactive({ name: "" });

function openEditWorkspace() {
  wsForm.name = workspace.value?.name ?? "";
  showEditWorkspace.value = true;
}

async function handleUpdateWorkspace() {
  if (!wsForm.name.trim()) return;
  submittingWs.value = true;
  try {
    const res = await api.put(`/api/admin/workspaces/${workspaceId.value}`, {
      name: wsForm.name,
    });
    workspace.value = {
      ...workspace.value,
      name: res.data.data?.name ?? wsForm.name,
    };
    showEditWorkspace.value = false;
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã cập nhật workspace",
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
    submittingWs.value = false;
  }
}

// ── Branches ────────────────────────────────────────────────────────
const showBranchDialog = ref(false);
const submittingBranch = ref(false);
const editingBranch = ref<any>(null);
const branchForm = reactive({ name: "", slug: "" });

// Auto-generate slug từ tên
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
  () => branchForm.name,
  (val) => {
    if (!editingBranch.value) {
      branchForm.slug = toSlug(val);
    }
  },
);

function openCreateBranch() {
  editingBranch.value = null;
  branchForm.name = "";
  branchForm.slug = "";
  showBranchDialog.value = true;
}

function openEditBranch(branch: any) {
  editingBranch.value = branch;
  branchForm.name = branch.name;
  branchForm.slug = branch.slug ?? "";
  showBranchDialog.value = true;
}

function closeBranchDialog() {
  showBranchDialog.value = false;
  editingBranch.value = null;
}

async function handleBranchSubmit() {
  if (!branchForm.name.trim()) return;
  if (!editingBranch.value && !branchForm.slug.trim()) return;
  submittingBranch.value = true;
  try {
    if (editingBranch.value) {
      await api.put(
        `/api/workspaces/${workspaceId.value}/branches/${editingBranch.value.id}`,
        { name: branchForm.name },
      );
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã cập nhật chi nhánh",
        life: 3000,
      });
    } else {
      await api.post(`/api/workspaces/${workspaceId.value}/branches`, {
        name: branchForm.name,
        slug: branchForm.slug,
      });
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã tạo chi nhánh",
        life: 3000,
      });
    }
    closeBranchDialog();
    fetchBranches();
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: err.response?.data?.message ?? "Có lỗi xảy ra",
      life: 3000,
    });
  } finally {
    submittingBranch.value = false;
  }
}

function confirmDeleteBranch(branch: any) {
  confirm.require({
    message: `Xóa chi nhánh "${branch.name}"?`,
    header: "Xác nhận xóa",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Hủy",
    acceptLabel: "Xóa",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await api.delete(
          `/api/workspaces/${workspaceId.value}/branches/${branch.id}`,
        );
        toast.add({
          severity: "success",
          summary: "Đã xóa",
          detail: branch.name,
          life: 3000,
        });
        fetchBranches();
        fetchAllMembers();
      } catch {
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xóa chi nhánh",
          life: 3000,
        });
      }
    },
  });
}

// ── Members ─────────────────────────────────────────────────────────
const showAddMemberDialog = ref(false);
const addMemberTab = ref<"new" | "existing">("new");
const addingMember = ref(false);
const newMemberForm = reactive({
  fullName: "",
  email: "",
  password: "",
  roleCode: "AGENT",
  branchId: null as number | null,
});
const existingMemberForm = reactive({
  userId: null as number | null,
  roleCode: "AGENT",
  branchId: null as number | null,
});
const availableUsersForWorkspace = ref<any[]>([]);
let availableUsersSearchTimer: ReturnType<typeof setTimeout> | undefined;

// OWNER & SUPER_ADMIN chọn ADMIN/AGENT, còn lại chỉ AGENT
const addRoleOptions = computed(() => {
  const isOwner =
    authStore.isSuperAdmin ||
    authStore.currentUser?.workspaces?.find(
      (w: any) =>
        w.workspaceId === Number(workspaceId.value) &&
        w.parentId === null &&
        w.roleCode === "OWNER",
    );
  return isOwner
    ? [
        { label: "Quản trị viên (Admin)", value: "ADMIN" },
        { label: "Nhân viên (Agent)", value: "AGENT" },
      ]
    : [{ label: "Nhân viên (Agent)", value: "AGENT" }];
});

function openAddMember() {
  addMemberTab.value = "new";
  newMemberForm.fullName = "";
  newMemberForm.email = "";
  newMemberForm.password = "";
  newMemberForm.roleCode = "AGENT";
  newMemberForm.branchId = null;
  existingMemberForm.userId = null;
  existingMemberForm.roleCode = "AGENT";
  existingMemberForm.branchId = null;
  showAddMemberDialog.value = true;
  if (authStore.isSuperAdmin) fetchAvailableUsers();
}

async function fetchAvailableUsers(search = "") {
  try {
    const res = await api.get("/api/admin/users", {
      params: { search: search.trim() || undefined },
    });
    const allUsers: any[] = res.data.data ?? [];
    const currentIds = new Set(
      allMembers.value
        .filter((m: any) => !m.branchName)
        .map((m: any) => m.userId),
    );
    availableUsersForWorkspace.value = allUsers
      .filter((u: any) => !currentIds.has(u.id))
      .map((u: any) => ({
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
      }));
  } catch {
    availableUsersForWorkspace.value = [];
  }
}

function handleAvailableUsersFilter(event: any) {
  if (availableUsersSearchTimer) clearTimeout(availableUsersSearchTimer);
  const search = event?.value ?? event?.filter ?? "";
  availableUsersSearchTimer = setTimeout(
    () => fetchAvailableUsers(search),
    1000,
  );
}

async function handleAddMember() {
  addingMember.value = true;
  try {
    let userId: number;
    let roleCode: string;
    let targetWorkspaceId: string | number;

    if (addMemberTab.value === "new") {
      if (
        !newMemberForm.fullName.trim() ||
        !newMemberForm.email.trim() ||
        !newMemberForm.password.trim()
      ) {
        toast.add({
          severity: "warn",
          summary: "Thiếu thông tin",
          detail: "Vui lòng điền đầy đủ",
          life: 3000,
        });
        return;
      }
      const regRes = await api.post("/api/auth/register", {
        fullName: newMemberForm.fullName,
        email: newMemberForm.email,
        password: newMemberForm.password,
      });
      userId = regRes.data.data?.id ?? regRes.data.data?.userId;
      roleCode = newMemberForm.roleCode;
      // Nếu chọn chi nhánh → add vào chi nhánh, không thì add vào workspace tổng
      targetWorkspaceId = newMemberForm.branchId ?? workspaceId.value;
    } else {
      if (!existingMemberForm.userId) {
        toast.add({
          severity: "warn",
          summary: "Chưa chọn",
          detail: "Vui lòng chọn người dùng",
          life: 3000,
        });
        return;
      }
      userId = existingMemberForm.userId;
      roleCode = existingMemberForm.roleCode;
      targetWorkspaceId = existingMemberForm.branchId ?? workspaceId.value;
    }

    await api.post(`/api/workspaces/${targetWorkspaceId}/members`, {
      userId,
      roleCode,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã thêm thành viên",
      life: 3000,
    });
    showAddMemberDialog.value = false;
    fetchAllMembers();
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
      `/api/workspaces/${member.workspaceId}/members/${member.id}/toggle-active`,
    );
    fetchAllMembers();
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
    message: `Xóa "${member.fullName}" khỏi ${member.branchName ?? "workspace tổng"}?`,
    header: "Xác nhận",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Hủy",
    acceptLabel: "Xóa",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await api.delete(
          `/api/workspaces/${member.workspaceId}/members/${member.id}`,
        );
        toast.add({
          severity: "success",
          summary: "Đã xóa",
          detail: member.fullName,
          life: 3000,
        });
        fetchAllMembers();
      } catch {
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xóa",
          life: 3000,
        });
      }
    },
  });
}

// ── Fetch ────────────────────────────────────────────────────────────
async function fetchWorkspace() {
  try {
    const url = authStore.isSuperAdmin
      ? `/api/admin/workspaces/${workspaceId.value}`
      : `/api/workspaces/${workspaceId.value}`;
    const res = await api.get(url);
    workspace.value = res.data.data;
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải workspace",
      life: 3000,
    });
  }
}

async function fetchBranches() {
  loadingBranches.value = true;
  try {
    const res = await api.get(`/api/workspaces/${workspaceId.value}/branches`);
    branches.value = res.data.data ?? [];
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải chi nhánh",
      life: 3000,
    });
  } finally {
    loadingBranches.value = false;
  }
}

async function fetchAllMembers() {
  loadingMembers.value = true;
  try {
    // 1. Members workspace tổng (OWNER, ADMIN)
    const parentRes = await api.get(
      `/api/workspaces/${workspaceId.value}/members`,
    );
    const parentMembers = (parentRes.data.data ?? []).map((m: any) => ({
      ...m,
      uniqueKey: `parent-${m.id}`,
      branchName: null,
    }));

    // 2. Members từng chi nhánh (AGENT)
    const branchList: any[] = branches.value.length
      ? branches.value
      : await api
          .get(`/api/workspaces/${workspaceId.value}/branches`)
          .then((r: any) => r.data.data ?? []);

    const branchMembersArrays = await Promise.all(
      branchList.map(async (b: any) => {
        try {
          const res = await api.get(`/api/workspaces/${b.id}/members`);
          return (res.data.data ?? []).map((m: any) => ({
            ...m,
            uniqueKey: `branch-${b.id}-${m.id}`,
            branchName: b.name,
          }));
        } catch {
          return [];
        }
      }),
    );

    allMembers.value = [
      ...parentMembers,
      ...([] as any[]).concat(...branchMembersArrays),
    ];
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải thành viên",
      life: 3000,
    });
  } finally {
    loadingMembers.value = false;
  }
}

onMounted(async () => {
  if (!authStore.currentUser) await authStore.fetchMe();
  await fetchWorkspace();
  await fetchBranches();
  await fetchAllMembers();
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
  color: #fff;
  border-color: #0f172a;
}
</style>
