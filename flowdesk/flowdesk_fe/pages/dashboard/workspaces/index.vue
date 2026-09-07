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
        @click="openCreate"
      />
    </AppPageHeader>

    <!-- Table -->
    <Card>
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

    <!-- Dialog tạo / sửa (chỉ SUPER_ADMIN) -->
    <Dialog
      v-if="authStore.isSuperAdmin"
      v-model:visible="showDialog"
      :header="editing ? 'Cập nhật Workspace' : 'Tạo Workspace mới'"
      modal
      style="width: 480px"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium"
            >Tên workspace <span class="text-red-500">*</span></label
          >
          <InputText
            v-model="form.name"
            placeholder="Nhập tên workspace"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Mô tả</label>
          <Textarea
            v-model="form.description"
            placeholder="Nhập mô tả"
            rows="3"
            fluid
          />
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" severity="secondary" text @click="closeDialog" />
        <Button
          :label="editing ? 'Cập nhật' : 'Tạo'"
          :loading="submitting"
          @click="handleSubmit"
        />
      </template>
    </Dialog>

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
const showDialog = ref(false);
const submitting = ref(false);
const editing = ref<any>(null);
const form = reactive({ name: "", description: "" });

async function fetchWorkspaces() {
  loading.value = true;
  try {
    if (authStore.isSuperAdmin) {
      // SUPER_ADMIN: lấy toàn bộ workspace qua admin API
      const res = await api.get("/api/admin/workspaces");
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

function openCreate() {
  editing.value = null;
  form.name = "";
  form.description = "";
  showDialog.value = true;
}

function openEdit(ws: any) {
  editing.value = ws;
  form.name = ws.name;
  form.description = ws.description ?? "";
  showDialog.value = true;
}

function closeDialog() {
  showDialog.value = false;
  editing.value = null;
}

async function handleSubmit() {
  if (!form.name.trim()) return;
  submitting.value = true;
  try {
    if (editing.value) {
      await api.put(`/api/admin/workspaces/${editing.value.id}`, form);
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã cập nhật workspace",
        life: 3000,
      });
    } else {
      await api.post("/api/admin/workspaces", form);
      toast.add({
        severity: "success",
        summary: "Thành công",
        detail: "Đã tạo workspace",
        life: 3000,
      });
    }
    closeDialog();
    fetchWorkspaces();
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: err.response?.data?.message ?? "Có lỗi xảy ra",
      life: 3000,
    });
  } finally {
    submitting.value = false;
  }
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
