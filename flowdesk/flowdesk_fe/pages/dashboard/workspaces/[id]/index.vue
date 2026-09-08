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
      :available-users="availableUsersForWorkspace"
      @added="fetchAllMembers"
      @filter="handleAvailableUsersFilter"
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
const availableUsersForWorkspace = ref<any[]>([]);
let availableUsersSearchTimer: ReturnType<typeof setTimeout> | undefined;

function openAddMember() {
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

function handleAvailableUsersFilter(search: string) {
  if (availableUsersSearchTimer) clearTimeout(availableUsersSearchTimer);
  availableUsersSearchTimer = setTimeout(
    () => fetchAvailableUsers(search),
    400,
  );
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
    const parentRes = await api.get(
      `/api/workspaces/${workspaceId.value}/members`,
    );
    const parentMembers = (parentRes.data.data ?? []).map((m: any) => ({
      ...m,
      uniqueKey: `parent-${m.id}`,
      branchName: null,
    }));

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
</style>
