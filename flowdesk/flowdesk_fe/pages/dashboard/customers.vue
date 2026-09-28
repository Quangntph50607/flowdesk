<template>
  <div class="fd-page">
    <AppPageHeader
      title="Khách hàng"
      subtitle="Quản lý khách hàng theo workspace và chi nhánh"
      breadcrumb="CRM"
    >
      <div class="flex gap-2 items-center">
        <Button
          :disabled="!tagWorkspaceId"
          label="Quản lý tag"
          icon="pi pi-tag"
          size="small"
          @click="openTagManager"
        />
        <Button
          label="Thêm khách hàng"
          icon="pi pi-plus"
          size="small"
          @click="openCreate"
        />
      </div>
    </AppPageHeader>

    <Card class="mb-5">
      <template #content>
        <div class="flex-wrap md:flex gap-3">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="filters.search"
              placeholder="Tên, SDT, email"
              class="md:w-80 w-full"
              @input="debouncedFetch"
            />
          </IconField>

          <Select
            v-if="canUseWorkspaceSelect"
            v-model="filters.workspaceId"
            :options="workspaceOptions"
            option-label="name"
            option-value="id"
            placeholder="Workspace tổng"
            show-clear
            class="md:w-52 w-full"
            @change="handleWorkspaceFilterChange"
          />

          <Select
            v-model="filters.branchId"
            :options="visibleBranchOptions"
            option-label="name"
            option-value="id"
            placeholder="Chi nhánh"
            show-clear
            class="md:w-52 w-full"
            @change="fetchCustomers"
          />

          <Select
            v-model="filters.status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Trạng thái"
            show-clear
            class="md:w-52 w-full"
            @change="fetchCustomers"
          />

          <Select
            v-if="filters.workspaceId"
            v-model="filters.tagId"
            :options="tags"
            option-label="name"
            option-value="id"
            placeholder="Tag"
            show-clear
            class="md:w-52 w-full"
            @change="fetchCustomers"
          />
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <DataTable
          :value="customers"
          :loading="loading"
          data-key="id"
          striped-rows
          row-hover
        >
          <Column
            header="Khách hàng"
            sortable
            sort-field="name"
            style="min-width: 200px"
          >
            <template #body="{ data }">
              <div>
                <p class="text-sm font-semibold text-slate-900">
                  {{ data.name }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ data.phone || "Chưa có SĐT" }}
                </p>
              </div>
            </template>
          </Column>
          <Column field="email" header="Email" />
          <Column field="branchName" header="Chi nhánh" />
          <Column header="Tags" style="min-width: 180px">
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in data.tags"
                  :key="tag.id"
                  class="inline-flex h-6 items-center rounded-full border border-solid bg-white px-2 text-xs font-semibold"
                  :style="{ borderColor: tag.color, color: tag.color }"
                >
                  {{ tag.name }}
                </span>
              </div>
            </template>
          </Column>
          <Column header="Trạng thái" style="width: 150px">
            <template #body="{ data }">
              <Tag
                :value="statusLabel(data.status)"
                :severity="statusSeverity(data.status)"
              />
            </template>
          </Column>
          <Column field="assignedUserName" header="Phụ trách" />
          <Column header="Hành động" style="width: 120px">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                @click="openEdit(data)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="py-8 text-center text-slate-400">
              Chưa có khách hàng
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <CustomerFormDrawer
      v-model:visible="showDrawer"
      :editing-customer="editingCustomer"
      :form="form"
      :can-use-workspace-select="canUseWorkspaceSelect"
      :workspace-options="workspaceOptions"
      :form-branch-options="formBranchOptions"
      :member-options="memberOptions"
      :form-tags="formTags"
      :activities="activities"
      :status-options="statusOptions"
      :will-move-out-of-visible-branch="willMoveOutOfVisibleBranch"
      :saving="saving"
      :errors="formErrors"
      @submit="saveCustomer"
      @workspace-change="handleFormWorkspaceChange"
      @branch-change="handleFormBranchChange"
    />

    <CustomerTagDialog
      v-model:visible="showTagDialog"
      :tag-workspace-name="tagWorkspaceName"
      :tag-form="tagForm"
      :tag-drafts="tagDrafts"
      :tag-saving="tagSaving"
      :deleting-tag-id="deletingTagId"
      :tag-errors="tagErrors"
      @create="createTag"
      @update-tag="updateTag"
      @delete-tag="deleteTag"
    />
  </div>
</template>

<script setup lang="ts">

definePageMeta({ middleware: "auth" });

const api = useApi();
const authStore = useAuthStore();
const toast = useAppToast();
const confirm = useAppConfirm();

const customers = ref<any[]>([]);
const workspaceOptions = ref<any[]>([]);
const branchOptions = ref<any[]>([]);
const myBranchOptions = ref<any[]>([]);
const tags = ref<any[]>([]);
const formTags = ref<any[]>([]);
const allMembers = ref<any[]>([]);
const activities = ref<any[]>([]);
const tagDrafts = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const tagSaving = ref(false);
const deletingTagId = ref<number | null>(null);
const showDrawer = ref(false);
const showTagDialog = ref(false);
const editingCustomer = ref<any>(null);
let searchTimer: ReturnType<typeof setTimeout> | undefined;

const statusOptions = [
  { label: "Mới", value: "NEW" },
  { label: "Đang chăm sóc", value: "CONTACTING" },
  { label: "Tiềm năng", value: "POTENTIAL" },
  { label: "Đã báo giá", value: "QUOTED" },
  { label: "Đã mua", value: "WON" },
  { label: "Ngừng quan tâm", value: "LOST" },
];

const filters = reactive({
  workspaceId: null as number | null,
  branchId: null as number | null,
  search: "",
  status: null as string | null,
  tagId: null as number | null,
});

const form = reactive({
  workspaceId: null as number | null,
  name: "",
  phone: "",
  email: "",
  address: "",
  source: "",
  status: "NEW",
  note: "",
  branchId: null as number | null,
  assignedUserId: null as number | null,
  tagIds: [] as number[],
});

const tagForm = reactive({
  name: "",
  color: "#2563eb",
});

const formErrors = reactive<Record<string, string>>({});
const tagErrors = reactive<Record<string, string>>({});

const PHONE_PATTERN = /^(0|\+84|84)(3|5|7|8|9)\d{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const canUseWorkspaceSelect = computed(() => {
  if (authStore.isSuperAdmin) return true;
  return Boolean(
    authStore.currentUser?.workspaces?.some(
      (item: any) =>
        item.parentId === null && ["OWNER", "ADMIN"].includes(item.roleCode),
    ),
  );
});

const visibleBranchOptions = computed(() =>
  canUseWorkspaceSelect.value ? branchOptions.value : myBranchOptions.value,
);

const formBranchOptions = computed(() =>
  canUseWorkspaceSelect.value ? branchOptions.value : myBranchOptions.value,
);

const tagWorkspaceId = computed(() => {
  if (filters.workspaceId) return filters.workspaceId;
  if (!canUseWorkspaceSelect.value)
    return myBranchOptions.value[0]?.parentId ?? null;
  return null;
});

const tagWorkspaceName = computed(() => {
  const workspaceId = tagWorkspaceId.value;
  if (!workspaceId) return "Chưa chọn workspace";
  const option = workspaceOptions.value.find(
    (item: any) => item.id === workspaceId,
  );
  if (option) return option.name;
  return (
    myBranchOptions.value.find((item: any) => item.parentId === workspaceId)
      ?.name ?? "Workspace hiện tại"
  );
});

const memberOptions = computed(() => {
  const map = new Map<number, any>();
  for (const group of allMembers.value) {
    map.set(group.userId, { userId: group.userId, fullName: group.fullName });
  }
  return Array.from(map.values());
});

const visibleBranchIds = computed(() =>
  visibleBranchOptions.value.map((branch: any) => branch.id),
);

const willMoveOutOfVisibleBranch = computed(() => {
  if (!editingCustomer.value || canUseWorkspaceSelect.value || !form.branchId)
    return false;
  return !visibleBranchIds.value.includes(form.branchId);
});

function statusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function statusSeverity(status: string) {
  if (status === "WON") return "success";
  if (status === "LOST") return "secondary";
  if (status === "QUOTED") return "warn";
  return "info";
}

function clearErrors(errors: Record<string, string>) {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function normalizePhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

function validateCustomerForm() {
  clearErrors(formErrors);
  const name = form.name.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();

  if (!name) {
    formErrors.name = "Họ tên là bắt buộc";
  } else if (name.length > 150) {
    formErrors.name = "Họ tên không được vượt quá 150 ký tự";
  }

  if (!form.workspaceId) {
    formErrors.workspaceId = "Hãy chọn workspace tổng";
  }

  if (!form.branchId) {
    formErrors.branchId = "Hãy chọn chi nhánh";
  }

  if (!phone) {
    formErrors.phone = "Số điện thoại là bắt buộc";
  } else if (!PHONE_PATTERN.test(normalizePhone(phone))) {
    formErrors.phone = "Số điện thoại chưa đúng định dạng";
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    formErrors.email = "Email chưa đúng định dạng";
  }

  return Object.keys(formErrors).length === 0;
}

function validateTagPayload(tag: { name?: string; color?: string }, errors: Record<string, string> = {}) {
  clearErrors(errors);
  const name = tag.name?.trim() ?? "";
  const color = tag.color?.trim() ?? "";

  if (!name) {
    errors.name = "Tên tag là bắt buộc";
  } else if (name.length > 80) {
    errors.name = "Tên tag không được vượt quá 80 ký tự";
  }

  if (!HEX_COLOR_PATTERN.test(color)) {
    errors.color = "Màu tag phải có dạng #RRGGBB";
  }

  return Object.keys(errors).length === 0;
}

async function loadWorkspaceOptions() {
  if (authStore.isSuperAdmin) {
    const res = await api.get("/api/admin/workspaces");
    workspaceOptions.value = res.data.data ?? [];
    return;
  }

  workspaceOptions.value =
    authStore.currentUser?.workspaces
      ?.filter(
        (item: any) =>
          item.parentId === null && ["OWNER", "ADMIN"].includes(item.roleCode),
      )
      .map((item: any) => ({
        id: item.workspaceId,
        name: item.workspaceName,
      })) ?? [];

  myBranchOptions.value =
    authStore.currentUser?.workspaces
      ?.filter((item: any) => item.parentId !== null)
      .map((item: any) => ({
        id: item.workspaceId,
        name: item.workspaceName,
        parentId: item.parentId,
      })) ?? [];
}

async function handleWorkspaceFilterChange() {
  filters.branchId = null;
  filters.tagId = null;
  await loadBranchesForWorkspace(filters.workspaceId);
  await loadTagsForWorkspace(filters.workspaceId);
  await fetchCustomers();
}

async function handleFormWorkspaceChange(
  options: { preserveBranchId?: boolean } = {},
) {
  delete formErrors.workspaceId;
  delete formErrors.branchId;
  const previousBranchId = form.branchId;
  form.branchId = null;
  form.assignedUserId = null;
  form.tagIds = [];
  await loadBranchesForWorkspace(form.workspaceId);
  formTags.value = await fetchTagsForWorkspace(form.workspaceId);
  if (
    options.preserveBranchId &&
    previousBranchId &&
    formBranchOptions.value.some(
      (branch: any) => branch.id === previousBranchId,
    )
  ) {
    form.branchId = previousBranchId;
  }
  await loadMembersForWorkspace(form.workspaceId, form.branchId);
  clearInvalidAssignedUser();
}

async function handleFormBranchChange() {
  delete formErrors.branchId;
  await loadMembersForWorkspace(form.workspaceId, form.branchId);
  clearInvalidAssignedUser();
}

function clearInvalidAssignedUser() {
  if (!form.assignedUserId) return;
  const canKeepAssignedUser = memberOptions.value.some(
    (member: any) => member.userId === form.assignedUserId,
  );
  if (!canKeepAssignedUser) {
    form.assignedUserId = null;
  }
}

async function loadBranchesForWorkspace(workspaceId: number | null) {
  if (!workspaceId) {
    branchOptions.value = [];
    return;
  }
  const res = await api.get(`/api/workspaces/${workspaceId}/branches`);
  branchOptions.value = res.data.data ?? [];
}

async function loadTagsForWorkspace(workspaceId: number | null) {
  tags.value = await fetchTagsForWorkspace(workspaceId);
  if (showTagDialog.value) {
    tagDrafts.value = tags.value.map((tag: any) => ({ ...tag }));
  }
}

async function fetchTagsForWorkspace(workspaceId: number | null) {
  if (!workspaceId) return [];
  const res = await api.get(`/api/workspaces/${workspaceId}/customer-tags`);
  return res.data.data ?? [];
}

async function loadMembersForWorkspace(
  workspaceId: number | null,
  branchId: number | null = null,
) {
  if (!workspaceId) {
    allMembers.value = [];
    return;
  }
  const res = await api.get(`/api/workspaces/${workspaceId}/all-members`, {
    params: {
      branchId: branchId ?? undefined,
    },
  });
  allMembers.value = res.data.data ?? [];
}

function debouncedFetch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(fetchCustomers, 350);
}

async function fetchCustomers() {
  loading.value = true;
  try {
    const res = await api.get("/api/customers", {
      params: {
        workspaceId: filters.workspaceId ?? undefined,
        branchId: filters.branchId ?? undefined,
        search: filters.search.trim() || undefined,
        status: filters.status ?? undefined,
        tagId: filters.tagId ?? undefined,
      },
    });
    customers.value = res.data.data ?? [];
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải khách hàng",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  Object.assign(form, {
    workspaceId: filters.workspaceId,
    name: "",
    phone: "",
    email: "",
    address: "",
    source: "",
    status: "NEW",
    note: "",
    branchId: filters.branchId,
    assignedUserId: null,
    tagIds: [],
  });

  if (!canUseWorkspaceSelect.value) {
    const branch = myBranchOptions.value[0];
    form.branchId = filters.branchId ?? branch?.id ?? null;
    form.workspaceId = branch?.parentId ?? null;
  }
}

async function openCreate() {
  editingCustomer.value = null;
  activities.value = [];
  clearErrors(formErrors);
  resetForm();
  if (canUseWorkspaceSelect.value && form.workspaceId) {
    await handleFormWorkspaceChange({ preserveBranchId: true });
  } else if (form.workspaceId) {
    await loadMembersForWorkspace(form.workspaceId, form.branchId);
    formTags.value = await fetchTagsForWorkspace(form.workspaceId);
    clearInvalidAssignedUser();
  }
  showDrawer.value = true;
}

async function openEdit(customer: any) {
  const workspaceId = customer.workspaceId ?? filters.workspaceId;
  if (!workspaceId || !customer?.id) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không xác định được khách hàng",
      life: 3000,
    });
    return;
  }

  loading.value = true;
  clearErrors(formErrors);
  let customerDetail = customer;
  try {
    const res = await api.get(
      `/api/workspaces/${workspaceId}/customers/${customer.id}`,
    );
    customerDetail = res.data.data ?? customer;
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải chi tiết khách hàng",
      life: 3000,
    });
    loading.value = false;
    return;
  } finally {
    loading.value = false;
  }

  editingCustomer.value = customerDetail;
  Object.assign(form, {
    workspaceId: customerDetail.workspaceId,
    name: customerDetail.name ?? "",
    phone: customerDetail.phone ?? "",
    email: customerDetail.email ?? "",
    address: customerDetail.address ?? "",
    source: customerDetail.source ?? "",
    status: customerDetail.status ?? "NEW",
    note: customerDetail.note ?? "",
    branchId: customerDetail.branchId,
    assignedUserId: customerDetail.assignedUserId ?? null,
    tagIds: customerDetail.tags?.map((tag: any) => tag.id) ?? [],
  });
  await loadBranchesForWorkspace(form.workspaceId);
  await loadMembersForWorkspace(form.workspaceId, form.branchId);
  formTags.value = await fetchTagsForWorkspace(form.workspaceId);
  clearInvalidAssignedUser();
  showDrawer.value = true;
  await fetchActivities(customerDetail.id);
}

async function saveCustomer() {
  if (!validateCustomerForm()) {
    toast.add({
      severity: "warn",
      summary: "Kiểm tra thông tin",
      detail: "Một số trường chưa hợp lệ",
      life: 3000,
    });
    return;
  }

  saving.value = true;
  const payload = {
    ...form,
    name: form.name.trim(),
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    address: form.address.trim() || null,
    source: form.source.trim() || null,
    note: form.note.trim() || null,
  };
  try {
    if (editingCustomer.value) {
      await api.put(
        `/api/workspaces/${form.workspaceId}/customers/${editingCustomer.value.id}`,
        payload,
      );
    } else {
      await api.post(`/api/workspaces/${form.workspaceId}/customers`, payload);
    }
    toast.add({
      severity: "success",
      summary: "Lưu thông tin khách hàng thành công",
      detail: form.name,
      life: 3000,
    });
    showDrawer.value = false;
    await fetchCustomers();
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể lưu khách hàng",
      life: 3000,
    });
  } finally {
    saving.value = false;
  }
}

async function createTag() {
  const workspaceId = tagWorkspaceId.value;
  if (!workspaceId) return;
  if (!validateTagPayload(tagForm, tagErrors)) return;
  tagSaving.value = true;
  try {
    await api.post(`/api/workspaces/${workspaceId}/customer-tags`, tagForm);
    tagForm.name = "";
    tagForm.color = "#2563eb";
    clearErrors(tagErrors);
    await reloadTagManager(workspaceId);
    tagSaving.value = false;
    toast.add({ severity: "success", summary: "Đã tạo tag", life: 2000 });
  } catch {
    tagSaving.value = false;
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tạo tag",
      life: 3000,
    });
  }
}

async function openTagManager() {
  const workspaceId = tagWorkspaceId.value;
  tagSaving.value = false;
  clearErrors(tagErrors);
  if (!workspaceId) {
    toast.add({
      severity: "warn",
      summary: "Chọn workspace",
      detail: "Hãy chọn workspace tổng trước",
      life: 3000,
    });
    return;
  }
  await reloadTagManager(workspaceId);
  showTagDialog.value = true;
}

async function reloadTagManager(workspaceId: number) {
  const nextTags = await fetchTagsForWorkspace(workspaceId);
  tags.value = nextTags;
  tagDrafts.value = nextTags.map((tag: any) => ({ ...tag }));
  if (form.workspaceId === workspaceId) {
    formTags.value = nextTags;
  }
}

async function updateTag(tag: any) {
  const workspaceId = tagWorkspaceId.value;
  if (!workspaceId || !tag?.id) return;
  const draftErrors: Record<string, string> = {};
  if (!validateTagPayload(tag, draftErrors)) {
    toast.add({
      severity: "warn",
      summary: "Kiểm tra tag",
      detail: draftErrors.name || draftErrors.color,
      life: 3000,
    });
    return;
  }
  try {
    await api.put(`/api/workspaces/${workspaceId}/customer-tags/${tag.id}`, {
      name: tag.name,
      color: tag.color,
    });
    await reloadTagManager(workspaceId);
    await fetchCustomers();
    toast.add({ severity: "success", summary: "Đã cập nhật tag", life: 2000 });
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể cập nhật tag",
      life: 3000,
    });
  }
}

async function deleteTag(tag: any) {
  const workspaceId = tagWorkspaceId.value;
  if (!workspaceId || !tag?.id) return;
  const accepted = await confirm.ask({
    title: "Xóa tag",
    message: `Xóa tag "${tag.name}" khỏi workspace này?`,
    confirmLabel: "Xóa",
    cancelLabel: "Hủy",
    tone: "danger",
  });
  if (!accepted) return;
  deletingTagId.value = tag.id;
  try {
    await api.delete(`/api/workspaces/${workspaceId}/customer-tags/${tag.id}`);
    if (filters.tagId === tag.id) {
      filters.tagId = null;
    }
    form.tagIds = form.tagIds.filter((id) => id !== tag.id);
    await reloadTagManager(workspaceId);
    await fetchCustomers();
    toast.add({ severity: "success", summary: "Đã xóa tag", life: 2000 });
  } catch {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể xóa tag",
      life: 3000,
    });
  } finally {
    deletingTagId.value = null;
  }
}

async function fetchActivities(customerId: number) {
  try {
    const res = await api.get(
      `/api/workspaces/${form.workspaceId}/customers/${customerId}/activities`,
    );
    activities.value = res.data.data ?? [];
  } catch {
    activities.value = [];
  }
}

onMounted(async () => {
  if (!authStore.currentUser) await authStore.fetchMe();
  await loadWorkspaceOptions();
  await fetchCustomers();
});
</script>
