<template>
  <div class="fd-auth-card">
    <div class="text-center pt-10 px-8 pb-2">
      <div
        class="inline-flex items-center justify-center rounded-2xl mb-4"
        style="width: 48px; height: 48px; background-color: #0f172a"
      >
        <i class="pi pi-briefcase" style="color: #ffffff; font-size: 18px" />
      </div>
      <div class="text-2xl font-bold mb-1" style="color: #0f172a">
        Tạo workspace
      </div>
      <p class="text-sm" style="color: #64748b">
        Bạn cần tạo workspace đầu tiên để tiếp tục vào Flowdesk
      </p>
    </div>

    <div class="px-8 pb-8">
      <form class="flex flex-col gap-4" @submit.prevent="handleCreateWorkspace">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Tên workspace</label>
          <InputText
            v-model="form.name"
            placeholder="Flowdesk Team"
            :invalid="!!errors.name"
            fluid
          />
          <small v-if="errors.name" class="text-red-500">
            {{ errors.name }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Slug</label>
          <InputText
            v-model="form.slug"
            placeholder="flowdesk-team"
            :invalid="!!errors.slug"
            fluid
          />
          <small v-if="errors.slug" class="text-red-500">
            {{ errors.slug }}
          </small>
          <span v-else class="text-xs" style="color: #94a3b8">
            Slug chỉ gồm chữ thường, số và dấu gạch ngang.
          </span>
        </div>

        <AppInlineAlert v-if="errorMsg" severity="error">
          {{ errorMsg }}
        </AppInlineAlert>

        <Button
          type="submit"
          label="Tạo workspace"
          :loading="loading"
          fluid
          class="!px-5 !text-sm"
        />
      </form>

      <Button
        label="Đăng xuất"
        severity="secondary"
        text
        fluid
        class="!mt-3 !px-5 !text-sm"
        @click="authStore.logout"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth", middleware: "auth" });

const api = useApi();
const authStore = useAuthStore();
const router = useRouter();

const form = reactive({ name: "", slug: "" });
const errors = reactive({ name: "", slug: "" });
const errorMsg = ref("");
const loading = ref(false);

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

watch(
  () => form.name,
  (value) => {
    form.slug = toSlug(value);
  },
);

function validate() {
  errors.name = "";
  errors.slug = "";
  let ok = true;

  if (!form.name.trim()) {
    errors.name = "Tên workspace không được để trống";
    ok = false;
  }
  if (!form.slug.trim()) {
    errors.slug = "Slug không được để trống";
    ok = false;
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
    errors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang";
    ok = false;
  }

  return ok;
}

async function handleCreateWorkspace() {
  if (!validate()) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    await api.post("/api/workspaces", {
      name: form.name.trim(),
      slug: form.slug.trim(),
    });
    await authStore.fetchMe();
    await router.push("/dashboard");
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || "Tạo workspace thất bại";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const fullName = authStore.currentUser?.fullName?.trim();
  if (fullName && !form.name) {
    form.name = `${fullName}'s Workspace`;
  }
});
</script>
