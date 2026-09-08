<template>
  <div class="fd-page">
    <AppPageHeader
      title="Workspaces"
      subtitle="Quản lý các workspace trong hệ thống"
      breadcrumb="Management"
    >
      <Button
        v-if="authStore.isSuperAdmin"
        label="Tạo Workspace"
        icon="pi pi-plus"
        class="!px-5 !text-sm"
        @click="openCreate"
      />
    </AppPageHeader>

    <!-- Table -->
    <Card>
      <template #header>
        <div class="px-5 pt-4 pb-0">
          <InputText
            v-if="authStore.isSuperAdmin"
            v-model="search"
            placeholder="Tìm theo tên workspace..."
            class="w-full md:w-80"
          >
            <template #prefix>
              <i class="pi pi-search" />
            </template>
          </InputText>
        </div>
      </template>
      <template #content>
        <DataTable
          :value="workspaces"
          :loading="loading"
          paginator
          :rows="10"
          striped-rows
          data-key="id"
        >
          <Column field="name" header="Tên" sortable />
          <Column field="description" header="Mô tả" />
          <Column field="ownerName" header="Chủ sở hữu" />
          <Column header="Hành động" style="width: 120px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-eye"
                  text
                  rounded
                  size="small"
                  severity="info"
                  v-tooltip.top="'Xem chi tiết'"
                  @click="navigateTo(`/dashboard/workspaces/${data.id}`)"
                />
                <template v-if="authStore.isSuperAdmin">
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    severity="warn"
                    v-tooltip.top="'Chỉnh sửa'"
                    @click="openEdit(data)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    v-tooltip.top="'Xóa'"
                    @click="confirmDelete(data)"
                  />
                </template>
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-10 text-surface-400">
              <i class="pi pi-briefcase text-4xl mb-3 block" />
              Chưa có workspace nào
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <WorkspaceFormDialog
      v-if="authStore.isSuperAdmin"
      v-model:visible="showDialog"
      :workspace="editing"
      @saved="fetchWorkspaces"
    />

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

definePageMeta({ middleware: "auth" });

const api = useApi();
const authStore = useAuthStore();
const confirm = useConfirm();
const toast = useToast();

const workspaces = ref<any[]>([]);
const loading = ref(false);
const search = ref("");
const showDialog = ref(false);
const editing = ref<any>(null);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function fetchWorkspaces() {
  loading.value = true;
  try {
    if (authStore.isSuperAdmin) {
      // SUPER_ADMIN: lấy toàn bộ workspace qua admin API
      const res = await api.get("/api/admin/workspaces", {
        params: { search: search.value.trim() || undefined },
      });
      workspaces.value = res.data.data ?? [];
    } else {
      // OWNER/ADMIN/AGENT: lấy workspace của mình từ /api/me
      // đảm bảo user đã được load
      if (!authStore.currentUser) {
        await authStore.fetchMe();
      }
      // Map từ WorkspaceInfo sang shape tương tự WorkspaceResponse
      workspaces.value = (authStore.myWorkspaces ?? []).map((w) => ({
        id: w.workspaceId,
        name: w.workspaceName,
        slug: w.workspaceSlug,
        ownerName: authStore.currentUser?.fullName ?? "",
        roleCode: w.roleCode,
      }));
    }
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải workspaces",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchWorkspaces, 1000);
});

function openCreate() {
  editing.value = null;
  showDialog.value = true;
}

function openEdit(ws: any) {
  editing.value = ws;
  showDialog.value = true;
}

function confirmDelete(ws: any) {
  confirm.require({
    message: `Bạn có chắc muốn xóa workspace "${ws.name}"?`,
    header: "Xác nhận xóa",
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Hủy",
    acceptLabel: "Xóa",
    acceptProps: { severity: "danger" },
    accept: async () => {
      try {
        await api.delete(`/api/admin/workspaces/${ws.id}`);
        toast.add({
          severity: "success",
          summary: "Đã xóa",
          detail: ws.name,
          life: 3000,
        });
        fetchWorkspaces();
      } catch {
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail: "Không thể xóa workspace",
          life: 3000,
        });
      }
    },
  });
}

onMounted(fetchWorkspaces);
</script>
