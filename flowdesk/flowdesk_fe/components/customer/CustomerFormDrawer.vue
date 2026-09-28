<template>
  <Drawer
    v-model:visible="drawerVisible"
    position="right"
    :header="editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'"
    class="!w-full md:!w-[520px]"
  >
    <form class="flex flex-col gap-4" @submit.prevent="$emit('submit')">
      <div
        v-if="editingCustomer"
        class="grid grid-cols-2 rounded-lg bg-slate-100 p-1"
      >
        <button
          type="button"
          class="rounded-md px-3 py-2 text-sm font-semibold transition"
          :class="
            activeTab === 'info'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="activeTab = 'info'"
        >
          Thông tin
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-2 text-sm font-semibold transition"
          :class="
            activeTab === 'history'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          "
          @click="activeTab = 'history'"
        >
          Lịch sử gần đây
        </button>
      </div>

      <div
        v-show="!editingCustomer || activeTab === 'info'"
        class="flex flex-col gap-4"
      >
        <div class="grid grid-cols-1 gap-3">
        <div>
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
            >Họ tên <span class="text-red-600">*</span></label
          >
          <InputText
            v-model="form.name"
            class="w-full"
            :invalid="Boolean(errors.name)"
          />
          <small v-if="errors.name" class="mt-1 block text-xs text-red-600">
            {{ errors.name }}
          </small>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
              >Số điện thoại <span class="text-red-600">*</span></label
            >
            <InputText
              v-model="form.phone"
              class="w-full"
              :invalid="Boolean(errors.phone)"
              inputmode="tel"
            />
            <small v-if="errors.phone" class="mt-1 block text-xs text-red-600">
              {{ errors.phone }}
            </small>
          </div>
          <div>
            <label
              class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
              >Email</label
            >
            <InputText
              v-model="form.email"
              class="w-full"
              :invalid="Boolean(errors.email)"
              inputmode="email"
            />
            <small v-if="errors.email" class="mt-1 block text-xs text-red-600">
              {{ errors.email }}
            </small>
          </div>
        </div>
        <div>
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
            >Địa chỉ</label
          >
          <InputText v-model="form.address" class="w-full" />
        </div>
      </div>

      <Divider />

      <div class="grid grid-cols-1 gap-3">
        <div v-if="canUseWorkspaceSelect">
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
            >Workspace tổng <span class="text-red-600">*</span></label
          >
          <Select
            v-model="form.workspaceId"
            :options="workspaceOptions"
            option-label="name"
            option-value="id"
            class="w-full"
            :invalid="Boolean(errors.workspaceId)"
            @change="$emit('workspace-change')"
          />
          <small
            v-if="errors.workspaceId"
            class="mt-1 block text-xs text-red-600"
          >
            {{ errors.workspaceId }}
          </small>
        </div>
        <div>
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
            >Chi nhánh <span class="text-red-600">*</span></label
          >
          <Select
            v-model="form.branchId"
            :options="formBranchOptions"
            option-label="name"
            option-value="id"
            class="w-full"
            :invalid="Boolean(errors.branchId)"
            @change="$emit('branch-change')"
          />
          <small v-if="errors.branchId" class="mt-1 block text-xs text-red-600">
            {{ errors.branchId }}
          </small>
          <small
            v-if="willMoveOutOfVisibleBranch"
            class="mt-1.5 block text-amber-700"
          >
            Sau khi chuyển sang chi nhánh khác, bạn có thể không còn thấy khách
            hàng này.
          </small>
        </div>
        <div>
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
            >Người phụ trách</label
          >
          <Select
            v-model="form.assignedUserId"
            :options="memberOptions"
            option-label="fullName"
            option-value="userId"
            placeholder="Chưa gán"
            show-clear
            class="w-full"
          />
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
              >Trạng thái</label
            >
            <Select
              v-model="form.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div>
            <label
              class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
              >Nguồn</label
            >
            <InputText
              v-model="form.source"
              class="w-full"
              placeholder="Facebook, Zalo..."
            />
          </div>
        </div>
        <div>
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
            >Tags</label
          >
          <MultiSelect
            v-model="form.tagIds"
            :options="formTags"
            option-label="name"
            option-value="id"
            display="chip"
            class="w-full"
          />
        </div>
        <div>
          <label
            class="mb-1.5 block text-xs font-semibold uppercase text-slate-500"
            >Ghi chú</label
          >
          <Textarea v-model="form.note" rows="4" class="w-full" auto-resize />
        </div>
      </div>
      </div>

      <div
        v-if="editingCustomer"
        v-show="activeTab === 'history'"
        class="min-h-40"
      >
        <div v-if="activities.length">
        <p class="mb-2 text-xs font-bold uppercase text-slate-500">
          Lịch sử gần đây
        </p>
        <div
          v-for="item in activities"
          :key="item.id"
          class="flex justify-between gap-3 border-b border-slate-100 py-2 text-[13px] text-slate-900"
        >
          <span>{{ item.description }}</span>
          <small class="text-slate-400">{{ item.actorName }}</small>
        </div>
        </div>
        <div
          v-else
          class="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400"
        >
          Chưa có lịch sử
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button
          label="Hủy"
          severity="secondary"
          text
          type="button"
          @click="drawerVisible = false"
        />
        <Button label="Lưu" icon="pi pi-save" type="submit" :loading="saving" />
      </div>
    </form>
  </Drawer>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  editingCustomer: any;
  form: any;
  canUseWorkspaceSelect: boolean;
  workspaceOptions: any[];
  formBranchOptions: any[];
  memberOptions: any[];
  formTags: any[];
  activities: any[];
  statusOptions: { label: string; value: string }[];
  willMoveOutOfVisibleBranch: boolean;
  saving: boolean;
  errors: Record<string, string>;
}>();

const emit = defineEmits<{
  (event: "update:visible", value: boolean): void;
  (event: "submit"): void;
  (event: "workspace-change"): void;
  (event: "branch-change"): void;
}>();

const activeTab = ref<"info" | "history">("info");

const drawerVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) activeTab.value = "info";
  },
);
</script>
