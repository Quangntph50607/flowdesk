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
            class="!px-5 !text-sm"
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

    <WorkspaceBranchEdit
      v-model:visible="showEditDialog"
      :workspace-id="workspaceId"
      :branch-id="branchId"
      :branch-name="branch?.name ?? ''"
      @updated="
        (name) => {
          branch = { ...branch, name };
        }
      "
    />

    <WorkspaceAddMemberToBranch
      v-model:visible="showAddMemberDialog"
      :workspace-id="workspaceId"
      :branch-id="branchId"
      :parent-workspace-name="parentWorkspaceName"
      :is-owner="isOwner"
      :available-members="availableMembers"
      :loading-available="loadingAvailable"
      @added="fetchMembers"
      @filter="handleAvailableMembersFilter"
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
const branchId = computed(() => route.params.branchId as string);

const branch = ref<any>(null);
const parentWorkspaceName = ref("...");
const members = ref<any[]>([]);
const loadingMembers = ref(false);

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

// ── Edit branch ──────────────────────────────────────────────────────
const showEditDialog = ref(false);
function openEditBranch() {
  showEditDialog.value = true;
}

// ── Add member ───────────────────────────────────────────────────────
const showAddMemberDialog = ref(false);
const loadingAvailable = ref(false);
const availableMembers = ref<any[]>([]);
let availableMembersSearchTimer: ReturnType<typeof setTimeout> | undefined;

async function openAddMember() {
  showAddMemberDialog.value = true;
  await fetchAvailableMembers();
}

async function fetchAvailableMembers(search = "") {
  loadingAvailable.value = true;
  try {
    const res = await api.get(`/api/workspaces/${workspaceId.value}/members`, {
      params: { search: search.trim() || undefined },
    });
    const currentMemberIds = new Set(members.value.map((m: any) => m.userId));
    availableMembers.value = (res.data.data ?? [])
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

function handleAvailableMembersFilter(search: string) {
  if (availableMembersSearchTimer) clearTimeout(availableMembersSearchTimer);
  availableMembersSearchTimer = setTimeout(
    () => fetchAvailableMembers(search),
    400,
  );
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
    // parentName được trả thẳng từ WorkspaceResponse.parentName — không cần gọi thêm API
    parentWorkspaceName.value = res.data.data?.parentName ?? "Workspace tổng";
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải chi nhánh",
      life: 3000,
    });
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
  await Promise.all([fetchBranch(), fetchMembers()]);
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
