<template>
  <div class="fd-page">
    <!-- Header -->
    <AppPageHeader
      :title="workspace?.name ?? 'Workspace'"
      :subtitle="`Slug: ${workspace?.slug ?? '...'}`"
      breadcrumb="Workspaces"
      back
    >
      <template v-if="canManage">
        <Button
          label="Sửa"
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          size="small"
          @click="openEditWorkspace"
        />
      </template>
    </AppPageHeader>

    <!-- Workspace info row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" v-if="workspace">
      <div class="fd-info-card">
        <span class="fd-info-label">Chủ sở hữu</span>
        <span class="fd-info-value">{{ workspace.ownerName ?? "—" }}</span>
      </div>
      <div class="fd-info-card">
        <span class="fd-info-label">Cấp độ</span>
        <span class="fd-info-value">
          <Tag value="Workspace tổng" severity="info" />
        </span>
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

    <!-- ======================== CHI NHÁNH ======================== -->
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
          <Column field="name" header="Tên chi nhánh" sortable>
            <template #body="{ data }">
              <span class="font-medium" style="color: #0f172a">{{
                data.name
              }}</span>
            </template>
          </Column>
          <Column field="slug" header="Slug" />
          <Column field="isActive" header="Trạng thái" style="width: 130px">
            <template #body="{ data }">
              <Tag
                :value="data.isActive ? 'Hoạt động' : 'Đã tắt'"
                :severity="data.isActive ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column v-if="canManage" header="Hành động" style="width: 110px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  severity="warn"
                  v-tooltip.top="'Sửa chi nhánh'"
                  @click="openEditBranch(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  v-tooltip.top="'Xóa chi nhánh'"
                  @click="confirmDeleteBranch(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-8 text-surface-400">
              <i class="pi pi-sitemap text-3xl mb-2 block" />
              Chưa có chi nhánh nào
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- ======================== THÀNH VIÊN ======================== -->
    <Card>
      <template #header>
        <div class="flex items-center justify-between px-6 pt-5 pb-0">
          <div>
            <h2 class="text-base font-semibold" style="color: #0f172a">
              Thành viên
            </h2>
            <p class="text-sm mt-0.5" style="color: #64748b">
              Owner và Admin quản lý workspace tổng này
            </p>
          </div>
          <Button
            v-if="canManage"
            label="Thêm thành viên"
            icon="pi pi-user-plus"
            size="small"
            @click="showAddMember = true"
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
          <Column field="roleCode" header="Vai trò" style="width: 130px">
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
          <Column field="isActive" header="Trạng thái" style="width: 120px">
            <template #body="{ data }">
              <Tag
                :value="data.isActive ? 'Hoạt động' : 'Tắt'"
                :severity="data.isActive ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column v-if="canManage" header="Hành động" style="width: 100px">
            <template #body="{ data }">
              <!-- Không cho toggle/xóa chính OWNER -->
              <div class="flex gap-1" v-if="data.roleCode !== 'OWNER'">
                <Button
                  :icon="data.isActive ? 'pi pi-ban' : 'pi pi-check'"
                  text
                  rounded
                  size="small"
                  :severity="data.isActive ? 'warn' : 'success'"
                  v-tooltip.top="data.isActive ? 'Tắt' : 'Bật'"
                  @click="toggleMember(data)"
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

    <!-- ======================== DIALOG: Tạo / Sửa chi nhánh ======================== -->
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
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Mô tả</label>
          <Textarea
            v-model="branchForm.description"
            placeholder="Nhập mô tả"
            rows="2"
            fluid
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

    <!-- ======================== DIALOG: Sửa workspace ======================== -->
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

    <!-- ======================== DIALOG: Thêm thành viên ======================== -->
    <Dialog
      v-model:visible="showAddMember"
      header="Thêm thành viên"
      modal
      style="width: 420px"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Email <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="memberForm.email"
            placeholder="email@example.com"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Vai trò</label>
          <Select
            v-model="memberForm.roleCode"
            :options="memberRoleOptions"
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
          @click="showAddMember = false"
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

// ── State ──────────────────────────────────────────────────────────
const workspace = ref<any>(null);
const branches = ref<any[]>([]);
const members = ref<any[]>([]);
const loadingBranches = ref(false);
const loadingMembers = ref(false);

// Kiểm tra quyền: SUPER_ADMIN hoặc OWNER/ADMIN của workspace này
const canManage = computed(() => {
  if (authStore.isSuperAdmin) return true;
  const myMembership = authStore.currentUser?.workspaces?.find(
    (w: any) =>
      w.workspaceId === Number(workspaceId.value) && w.parentId === null,
  );
  return (
    myMembership?.roleCode === "OWNER" || myMembership?.roleCode === "ADMIN"
  );
});

// ── Edit workspace ─────────────────────────────────────────────────
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

// ── Branches ───────────────────────────────────────────────────────
const showBranchDialog = ref(false);
const submittingBranch = ref(false);
const editingBranch = ref<any>(null);
const branchForm = reactive({ name: "", slug: "", description: "" });

function openCreateBranch() {
  editingBranch.value = null;
  branchForm.name = "";
  branchForm.slug = "";
  branchForm.description = "";
  showBranchDialog.value = true;
}

function openEditBranch(branch: any) {
  editingBranch.value = branch;
  branchForm.name = branch.name;
  branchForm.slug = branch.slug ?? "";
  branchForm.description = branch.description ?? "";
  showBranchDialog.value = true;
}

function closeBranchDialog() {
  showBranchDialog.value = false;
  editingBranch.value = null;
}

async function handleBranchSubmit() {
  if (!branchForm.name.trim() || !branchForm.slug.trim()) return;
  submittingBranch.value = true;
  try {
    if (editingBranch.value) {
      await api.put(
        `/api/workspaces/${workspaceId.value}/branches/${editingBranch.value.id}`,
        { name: branchForm.name, description: branchForm.description },
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
        description: branchForm.description,
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
    message: `Xóa chi nhánh "${branch.name}"? Hành động này không thể hoàn tác.`,
    header: "Xác nhận xóa chi nhánh",
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

// ── Members ────────────────────────────────────────────────────────
const showAddMember = ref(false);
const addingMember = ref(false);
const memberForm = reactive({ email: "", roleCode: "ADMIN" });
const memberRoleOptions = [
  { label: "Admin", value: "ADMIN" },
  { label: "Agent", value: "AGENT" },
];

async function handleAddMember() {
  if (!memberForm.email.trim()) return;
  addingMember.value = true;
  try {
    await api.post(`/api/workspaces/${workspaceId.value}/members`, {
      email: memberForm.email,
      roleCode: memberForm.roleCode,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã thêm thành viên",
      life: 3000,
    });
    showAddMember.value = false;
    memberForm.email = "";
    memberForm.roleCode = "ADMIN";
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
      `/api/workspaces/${workspaceId.value}/members/${member.id}/toggle-active`,
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
    message: `Xóa "${member.fullName}" khỏi workspace?`,
    header: "Xác nhận",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Hủy",
    acceptLabel: "Xóa",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await api.delete(
          `/api/workspaces/${workspaceId.value}/members/${member.id}`,
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
          detail: "Không thể xóa thành viên",
          life: 3000,
        });
      }
    },
  });
}

// ── Fetch ──────────────────────────────────────────────────────────
async function fetchWorkspace() {
  try {
    // SUPER_ADMIN dùng admin API, OWNER/ADMIN dùng member API
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

async function fetchMembers() {
  loadingMembers.value = true;
  try {
    const res = await api.get(`/api/workspaces/${workspaceId.value}/members`);
    members.value = res.data.data ?? [];
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
  fetchWorkspace();
  fetchBranches();
  fetchMembers();
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
</style>
