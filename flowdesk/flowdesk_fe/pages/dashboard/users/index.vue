<template>
  <div class="fd-page">
    <AppPageHeader
      title="Users"
      subtitle="Quản lý người dùng trong hệ thống"
      breadcrumb="Management"
    />

    <Card>
      <template #header>
        <div class="px-6 pt-5 pb-0">
          <InputText
            v-model="search"
            placeholder="Tìm theo tên hoặc email..."
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
          :value="filteredUsers"
          :loading="loading"
          paginator
          :rows="10"
          striped-rows
          data-key="id"
        >
          <Column field="fullName" header="Họ tên" sortable />
          <Column field="email" header="Email" sortable />
          <Column field="role" header="Vai trò" style="width: 130px">
            <template #body="{ data }">
              <Tag
                :value="data.role"
                :severity="data.role === 'SUPER_ADMIN' ? 'warn' : 'info'"
              />
            </template>
          </Column>
          <Column field="active" header="Trạng thái" style="width: 120px">
            <template #body="{ data }">
              <Tag
                :value="data.active ? 'Hoạt động' : 'Tắt'"
                :severity="data.active ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column header="Hành động" style="width: 100px">
            <template #body="{ data }">
              <div class="flex gap-1">
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
                  :icon="data.active ? 'pi pi-ban' : 'pi pi-check'"
                  text
                  rounded
                  size="small"
                  :severity="data.active ? 'danger' : 'success'"
                  v-tooltip.top="data.active ? 'Vô hiệu hóa' : 'Kích hoạt'"
                  @click="toggleUser(data)"
                />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-10 text-surface-400">
              <i class="pi pi-users text-4xl mb-3 block" />
              Không có dữ liệu
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <!-- Edit dialog -->
    <Dialog
      v-model:visible="showEdit"
      header="Cập nhật người dùng"
      modal
      style="width: 440px"
    >
      <div class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Họ và tên</label>
          <InputText v-model="editForm.fullName" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Email</label>
          <InputText v-model="editForm.email" disabled fluid />
        </div>
      </div>
      <template #footer>
        <Button
          label="Hủy"
          severity="secondary"
          text
          @click="showEdit = false"
        />
        <Button label="Cập nhật" :loading="submitting" @click="handleUpdate" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "primevue/usetoast";

definePageMeta({ middleware: "auth" });

const api = useApi();
const authStore = useAuthStore();
const toast = useToast();

// Redirect nếu không phải SUPER_ADMIN
onMounted(() => {
  if (!authStore.isSuperAdmin) {
    navigateTo("/dashboard");
  }
});

const users = ref<any[]>([]);
const loading = ref(false);
const search = ref("");
const showEdit = ref(false);
const submitting = ref(false);
const editingUser = ref<any>(null);
const editForm = reactive({ fullName: "", email: "" });

const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const q = search.value.toLowerCase();
  return users.value.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q),
  );
});

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await api.get("/api/admin/users");
    users.value = res.data.data ?? [];
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải danh sách người dùng",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}

function openEdit(user: any) {
  editingUser.value = user;
  editForm.fullName = user.fullName;
  editForm.email = user.email;
  showEdit.value = true;
}

async function handleUpdate() {
  submitting.value = true;
  try {
    await api.patch(`/api/admin/users/${editingUser.value.id}`, {
      fullName: editForm.fullName,
    });
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Đã cập nhật người dùng",
      life: 3000,
    });
    showEdit.value = false;
    fetchUsers();
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

async function toggleUser(user: any) {
  try {
    await api.patch(`/api/admin/users/${user.id}/toggle-active`);
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: `${user.active ? "Đã vô hiệu hóa" : "Đã kích hoạt"} tài khoản`,
      life: 3000,
    });
    fetchUsers();
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể thay đổi trạng thái",
      life: 3000,
    });
  }
}

onMounted(fetchUsers);
</script>
