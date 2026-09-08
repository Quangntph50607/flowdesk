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
        Đăng nhập vào tài khoản của bạn
      </p>
    </div>

    <div class="px-8 pb-8">
      <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Email</label>
          <InputText
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
            :invalid="!!errors.email"
            fluid
          />
          <small v-if="errors.email" class="text-red-500">{{
            errors.email
          }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-surface-700">Mật khẩu</label>
          <Password
            v-model="form.password"
            placeholder="Nhập mật khẩu"
            :feedback="false"
            toggle-mask
            :invalid="!!errors.password"
            fluid
          />
          <small v-if="errors.password" class="text-red-500">{{
            errors.password
          }}</small>
        </div>

        <Message v-if="errorMsg" severity="error" :closable="false">
          {{ errorMsg }}
        </Message>

        <Button
          type="submit"
          label="Đăng nhập"
          :loading="loading"
          fluid
          class="!px-5 !text-sm"
        />
      </form>

      <div class="text-center mt-6 text-sm">
        <span style="color: #64748b">Chưa có tài khoản? </span>
        <NuxtLink
          to="/register"
          class="font-semibold hover:underline"
          style="color: #0f172a"
        >
          Đăng ký
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth", middleware: "guest" });

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({ email: "", password: "" });
const errors = reactive({ email: "", password: "" });
const errorMsg = ref("");
const loading = ref(false);

function validate() {
  errors.email = "";
  errors.password = "";
  let ok = true;
  if (!form.email) {
    errors.email = "Email không được để trống";
    ok = false;
  }
  if (!form.password) {
    errors.password = "Mật khẩu không được để trống";
    ok = false;
  }
  return ok;
}

async function handleLogin() {
  if (!validate()) return;
  loading.value = true;
  errorMsg.value = "";
  try {
    await authStore.login(form.email, form.password);
    await router.push("/dashboard");
  } catch (err: any) {
    errorMsg.value =
      err.response?.data?.message || "Email hoặc mật khẩu không đúng";
  } finally {
    loading.value = false;
  }
}
</script>
