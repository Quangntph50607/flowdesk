<template>
  <div class="fd-auth-card">
    <div class="text-center pt-10 px-8 pb-2">
      <div
        class="inline-flex items-center justify-center rounded-2xl mb-4"
        style="width: 48px; height: 48px; background-color: #0f172a"
      >
        <i class="pi pi-th-large" style="color: #ffffff; font-size: 18px" />
      </div>
      <div class="text-2xl font-bold mb-1" style="color: #0f172a">Flowdesk</div>
      <p class="text-sm" style="color: #64748b">
        {{ step === "account" ? "Tạo tài khoản mới" : "Tạo workspace đầu tiên" }}
      </p>
    </div>

    <div class="px-8 pb-8">
      <form
        v-if="step === 'account'"
        class="flex flex-col gap-4"
        @submit.prevent="handleRegister"
      >
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Họ và tên</label>
          <InputText
            v-model="accountForm.fullName"
            placeholder="Nguyễn Văn A"
            :invalid="!!accountErrors.fullName"
            fluid
          />
          <small v-if="accountErrors.fullName" class="text-red-500">
            {{ accountErrors.fullName }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Email</label>
          <InputText
            v-model="accountForm.email"
            type="email"
            placeholder="email@example.com"
            :invalid="!!accountErrors.email"
            fluid
          />
          <small v-if="accountErrors.email" class="text-red-500">
            {{ accountErrors.email }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Mật khẩu</label>
          <Password
            v-model="accountForm.password"
            placeholder="Tối thiểu 6 ký tự"
            :feedback="false"
            toggle-mask
            :invalid="!!accountErrors.password"
            fluid
          />
          <small v-if="accountErrors.password" class="text-red-500">
            {{ accountErrors.password }}
          </small>
        </div>

        <AppInlineAlert v-if="errorMsg" severity="error">
          {{ errorMsg }}
        </AppInlineAlert>

        <Button
          type="submit"
          label="Đăng ký"
          :loading="loading"
          fluid
          class="!px-5 !text-sm"
        />
      </form>

      <form
        v-else
        class="flex flex-col gap-4"
        @submit.prevent="handleCreateWorkspace"
      >
        <AppInlineAlert severity="success">
          Tài khoản đã được tạo. Hãy tạo workspace để bắt đầu sử dụng Flowdesk.
        </AppInlineAlert>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Tên workspace</label>
          <InputText
            v-model="workspaceForm.name"
            placeholder="Flowdesk Team"
            :invalid="!!workspaceErrors.name"
            fluid
          />
          <small v-if="workspaceErrors.name" class="text-red-500">
            {{ workspaceErrors.name }}
          </small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Slug</label>
          <InputText
            v-model="workspaceForm.slug"
            placeholder="flowdesk-team"
            :invalid="!!workspaceErrors.slug"
            fluid
          />
          <small v-if="workspaceErrors.slug" class="text-red-500">
            {{ workspaceErrors.slug }}
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

      <div v-if="step === 'account'" class="text-center mt-6 text-sm">
        <span style="color: #64748b">Đã có tài khoản? </span>
        <NuxtLink
          to="/login"
          class="font-semibold hover:underline"
          style="color: #0f172a"
        >
          Đăng nhập
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth", middleware: "guest" });

const authStore = useAuthStore();
const api = useApi();
const router = useRouter();

const step = ref<"account" | "workspace">("account");
const accountForm = reactive({ fullName: "", email: "", password: "" });
const accountErrors = reactive({ fullName: "", email: "", password: "" });
const workspaceForm = reactive({ name: "", slug: "" });
const workspaceErrors = reactive({ name: "", slug: "" });
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
  () => workspaceForm.name,
  (value) => {
    workspaceForm.slug = toSlug(value);
  },
);

function validateAccount() {
  accountErrors.fullName = "";
  accountErrors.email = "";
  accountErrors.password = "";
  let ok = true;

  if (!accountForm.fullName.trim()) {
    accountErrors.fullName = "Họ tên không được để trống";
    ok = false;
  }
  if (!accountForm.email.trim()) {
    accountErrors.email = "Email không được để trống";
    ok = false;
  }
  if (!accountForm.password || accountForm.password.length < 6) {
    accountErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    ok = false;
  }

  return ok;
}

function validateWorkspace() {
  workspaceErrors.name = "";
  workspaceErrors.slug = "";
  let ok = true;

  if (!workspaceForm.name.trim()) {
    workspaceErrors.name = "Tên workspace không được để trống";
    ok = false;
  }
  if (!workspaceForm.slug.trim()) {
    workspaceErrors.slug = "Slug không được để trống";
    ok = false;
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workspaceForm.slug)) {
    workspaceErrors.slug = "Slug chỉ gồm chữ thường, số và dấu gạch ngang";
    ok = false;
  }

  return ok;
}

async function handleRegister() {
  if (!validateAccount()) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    await authStore.register(accountForm);
    workspaceForm.name = `${accountForm.fullName.trim()}'s Workspace`;
    step.value = "workspace";
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || "Đăng ký thất bại";
  } finally {
    loading.value = false;
  }
}

async function handleCreateWorkspace() {
  if (!validateWorkspace()) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    await api.post("/api/workspaces", {
      name: workspaceForm.name.trim(),
      slug: workspaceForm.slug.trim(),
    });
    await authStore.fetchMe();
    await router.push("/dashboard");
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || "Tạo workspace thất bại";
  } finally {
    loading.value = false;
  }
}
</script>
