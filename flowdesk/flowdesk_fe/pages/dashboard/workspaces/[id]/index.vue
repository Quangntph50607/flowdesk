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
            class="!px-5 !text-sm"
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
            class="!px-5 !text-sm"
            @click="openAddMember"
          />
        </div>
      </template>
      <template #content>
        <!-- BE trả về grouped — mỗi dòng là 1 user -->
        <DataTable
          :value="allMembers"
          :loading="loadingMembers"
          data-key="userId"
          striped-rows
          row-hover
          @row-click="openMemberDetail"
          style="cursor: pointer"
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
          <!-- Chi nhánh: BE tính sẵn "A, B +1..." -->
          <Column header="Chi nhánh" style="width: 220px">
            <template #body="{ data }">
              <span
                v-if="data.branchLabels"
                class="text-sm"
                style="color: #0f172a"
                >{{ data.branchLabels }}</span
              >
              <span v-else class="text-xs" style="color: #94a3b8"
                >— Workspace tổng</span
              >
            </template>
          </Column>
          <Column header="Trạng thái" style="width: 150px">
            <template #body="{ data }">
              <Tag
                :value="data.accountActive ? 'Hoạt động' : 'Ngưng hoạt động'"
                :severity="data.accountActive ? 'success' : 'danger'"
              />
            </template>
          </Column>
          <Column v-if="canManage" header="Hành động" style="width: 130px">
            <template #body="{ data }">
              <div
                class="flex items-center gap-2"
                v-if="data.roleCode !== 'OWNER'"
                @click.stop
              >
                <!-- Toggle = khoá/mở membership workspace tổng -->
                <ToggleSwitch
                  v-model="data.accountActive"
                  v-tooltip.top="
                    data.accountActive ? 'Khoá tài khoản' : 'Mở tài khoản'
                  "
                  @update:model-value="toggleAccountActive(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  v-tooltip.top="'Xóa khỏi workspace'"
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

    <!-- DIALOG CHI TIẾT THÀNH VIÊN -->
    <Dialog
      :visible="showMemberDetail"
      :header="selectedMember?.fullName ?? 'Chi tiết thành viên'"
      modal
      style="width: 520px"
      @update:visible="showMemberDetail = $event"
    >
      <div v-if="selectedMember" class="flex flex-col gap-4 pt-2">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center rounded-full font-bold text-sm shrink-0"
            style="
              width: 44px;
              height: 44px;
              background-color: #e2e8f0;
              color: #475569;
            "
          >
            {{ selectedMember.fullName?.charAt(0).toUpperCase() }}
          </div>
          <div>
            <p class="font-semibold text-sm" style="color: #0f172a">
              {{ selectedMember.fullName }}
            </p>
            <p class="text-xs" style="color: #94a3b8">
              {{ selectedMember.email }}
            </p>
          </div>
        </div>

        <Divider class="!my-1" />

        <div>
          <p
            class="text-xs font-semibold uppercase mb-2"
            style="color: #94a3b8; letter-spacing: 0.05em"
          >
            Thành viên tại
          </p>
          <div class="flex flex-col gap-2">
            <div
              v-for="m in selectedMember.memberships"
              :key="m.id"
              class="flex items-center justify-between px-3 py-2 rounded-lg"
              style="background: #f8fafc; border: 1px solid #e2e8f0"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium" style="color: #0f172a">
                  {{ m.branchName ?? "— Workspace tổng" }}
                </span>
                <Tag
                  :value="m.roleName ?? m.roleCode"
                  :severity="
                    m.roleCode === 'OWNER'
                      ? 'contrast'
                      : m.roleCode === 'ADMIN'
                        ? 'warn'
                        : 'info'
                  "
                  class="!text-xs"
                />
              </div>
              <div
                v-if="canManage && m.roleCode !== 'OWNER'"
                class="flex items-center gap-2"
              >
                <ToggleSwitch
                  v-model="m.isActive"
                  v-tooltip.top="m.isActive ? 'Tắt tại đây' : 'Bật tại đây'"
                  @update:model-value="toggleMembershipActive(m)"
                />
              </div>
              <Tag
                v-else-if="m.roleCode === 'OWNER'"
                value="Owner"
                severity="contrast"
                class="!text-xs"
              />
              <Tag
                v-else
                :value="m.isActive ? 'Hoạt động' : 'Tắt'"
                :severity="m.isActive ? 'success' : 'danger'"
                class="!text-xs"
              />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          label="Đóng"
          severity="secondary"
          text
          @click="showMemberDetail = false"
        />
      </template>
    </Dialog>

    <WorkspaceEditDialog
      v-model:visible="showEditWorkspace"
      :workspace="workspace ? { id: workspaceId, name: workspace.name } : null"
      @updated="
        (name) => {
          workspace = { ...workspace, name };
        }
      "
    />

    <WorkspaceBranchForm
      v-model:visible="showBranchDialog"
      :workspace-id="workspaceId"
      :branch="editingBranch"
      @saved="
        () => {
          closeBranchDialog();
          fetchBranches();
        }
      "
    />

    <WorkspaceAddMember
      v-model:visible="showAddMemberDialog"
      :workspace-id="workspaceId"
      :is-owner="!!canManage"
      :branches="branches"
      :all-members="allMembers"
      @added="fetchAllMembers"
    />

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
// BE trả về grouped: mỗi phần tử = 1 user { userId, fullName, email, roleCode,
// accountActive, workspaceMemberId, workspaceId, branchLabels, memberships[] }
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
function openEditWorkspace() {
  showEditWorkspace.value = true;
}

// ── Branches ────────────────────────────────────────────────────────
const showBranchDialog = ref(false);
const editingBranch = ref<any>(null);

function openCreateBranch() {
  editingBranch.value = null;
  showBranchDialog.value = true;
}
function openEditBranch(branch: any) {
  editingBranch.value = branch;
  showBranchDialog.value = true;
}
function closeBranchDialog() {
  showBranchDialog.value = false;
  editingBranch.value = null;
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
function openAddMember() {
  showAddMemberDialog.value = true;
}

// Toggle membership workspace tổng = khoá/mở tài khoản trong workspace
async function toggleAccountActive(row: any) {
  if (!row.workspaceMemberId) return;
  try {
    await api.patch(
      `/api/workspaces/${row.workspaceId}/members/${row.workspaceMemberId}/toggle-active`,
    );
    fetchAllMembers();
  } catch {
    row.accountActive = !row.accountActive;
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể cập nhật trạng thái",
      life: 3000,
    });
  }
}

// Toggle membership tại 1 chi nhánh cụ thể (trong dialog chi tiết)
async function toggleMembershipActive(membership: any) {
  try {
    await api.patch(
      `/api/workspaces/${membership.workspaceId}/members/${membership.id}/toggle-active`,
    );
    fetchAllMembers();
  } catch {
    membership.isActive = !membership.isActive;
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể cập nhật trạng thái",
      life: 3000,
    });
  }
}

function confirmRemoveMember(row: any) {
  if (!row.workspaceMemberId) return;
  confirm.require({
    message: `Xóa "${row.fullName}" khỏi workspace?`,
    header: "Xác nhận",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Hủy",
    acceptLabel: "Xóa",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await api.delete(
          `/api/workspaces/${row.workspaceId}/members/${row.workspaceMemberId}`,
        );
        toast.add({
          severity: "success",
          summary: "Đã xóa",
          detail: row.fullName,
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

// ── Member detail dialog ─────────────────────────────────────────────
const showMemberDetail = ref(false);
const selectedMember = ref<any>(null);

function openMemberDetail(event: any) {
  // Deep copy để thay đổi toggle trong dialog không ảnh hưởng trực tiếp table
  selectedMember.value = JSON.parse(JSON.stringify(event.data));
  showMemberDetail.value = true;
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

// 1 API — BE trả về grouped sẵn
async function fetchAllMembers() {
  loadingMembers.value = true;
  try {
    const res = await api.get(
      `/api/workspaces/${workspaceId.value}/all-members`,
    );
    allMembers.value = res.data.data ?? [];
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
  await Promise.all([fetchBranches(), fetchAllMembers()]);
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
