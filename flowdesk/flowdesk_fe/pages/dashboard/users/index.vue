<template>
  <div class="fd-page">
    <AppPageHeader
      title="Users"
      subtitle="Quản lý người dùng trong hệ thống"
      breadcrumb="Management"
    >
      <Button
        label="Thêm người dùng"
        icon="pi pi-plus"
        size="small"
        class="!px-5 !text-sm"
        @click="showCreate = true"
      />
    </AppPageHeader>

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
        <div class="overflow-x-auto">
          <DataTable
            :value="users"
            :loading="loading"
            paginator
            :rows="10"
            striped-rows
            data-key="id"
            class="min-w-[1000px]"
          >
            <Column field="fullName" header="Họ tên" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="phone" header="SĐT" style="width: 140px">
              <template #body="{ data }">
                {{ data.phone || "—" }}
              </template>
            </Column>
            <Column field="dateOfBirth" header="Ngày sinh" style="width: 130px">
              <template #body="{ data }">
                {{ formatDate(data.dateOfBirth) }}
              </template>
            </Column>
            <Column field="address" header="Địa chỉ">
              <template #body="{ data }">
                <span class="line-clamp-2">{{ data.address || "—" }}</span>
              </template>
            </Column>
            <Column field="updatedAt" header="Cập nhật" style="width: 130px">
              <template #body="{ data }">
                {{ formatDateTime(data.updatedAt) }}
              </template>
            </Column>
            <Column field="active" header="Trạng thái" style="width: 150px">
              <template #body="{ data }">
                <Tag
                  :value="isUserActive(data) ? 'Hoạt động' : 'Ngừng hoạt động'"
                  :severity="isUserActive(data) ? 'success' : 'danger'"
                />
              </template>
            </Column>
            <Column header="Hành động" style="width: 100px">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    severity="warn"
                    v-tooltip.top="'Chỉnh sửa'"
                    @click="openEdit(data)"
                  />
                  <ToggleSwitch
                    :model-value="isUserActive(data)"
                    @update:model-value="toggleUser(data)"
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
        </div>
      </template>
    </Card>

    <UserCreateDialog v-model:visible="showCreate" @created="fetchUsers" />

    <UserEditDialog
      v-model:visible="showEdit"
      :user="editingUser"
      @updated="fetchUsers"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const api = useApi();
const authStore = useAuthStore();
const toast = useAppToast();

onMounted(() => {
  if (!authStore.isSuperAdmin) navigateTo("/dashboard");
});

const users = ref<any[]>([]);
const loading = ref(false);
const search = ref("");
const showCreate = ref(false);
const showEdit = ref(false);
const editingUser = ref<any>(null);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function fetchUsers() {
  loading.value = true;
  try {
    const res = await api.get("/api/admin/users", {
      params: { search: search.value.trim() || undefined },
    });
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

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchUsers, 1000);
});

function openEdit(user: any) {
  editingUser.value = user;
  showEdit.value = true;
}

function isUserActive(user: any) {
  return user.isActive ?? user.active ?? false;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

async function toggleUser(user: any) {
  try {
    await api.patch(`/api/admin/users/${user.id}/toggle-active`);
    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: "Cập nhật trạng thái tài khoản thành công",
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
