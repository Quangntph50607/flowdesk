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
      <p class="text-sm" style="color: #64748b">Tạo tài khoản mới</p>
    </div>

    <div class="px-8 pb-8">
        <form class="flex flex-col gap-4" @submit.prevent="handleRegister">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-surface-700"
              >Họ và tên</label
            >
            <InputText
              v-model="form.fullName"
              placeholder="Nguyễn Văn A"
              :invalid="!!errors.fullName"
              fluid
            />
            <small v-if="errors.fullName" class="text-red-500">{{
              errors.fullName
            }}</small>
          </div>

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
              placeholder="Tối thiểu 6 ký tự"
              :feedback="false"
              toggle-mask
              :invalid="!!errors.password"
              fluid
            />
            <small v-if="errors.password" class="text-red-500">{{
              errors.password
            }}</small>
          </div>

          <Message v-if="errorMsg" severity="error" :closable="false">{{
            errorMsg
          }}</Message>
          <Message v-if="successMsg" severity="success" :closable="false">{{
            successMsg
          }}</Message>

          <Button type="submit" label="Đăng ký" :loading="loading" fluid />
        </form>

        <div class="text-center mt-6 text-sm">
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
const router = useRouter();

const form = reactive({ fullName: "", email: "", password: "" });
const errors = reactive({ fullName: "", email: "", password: "" });
const errorMsg = ref("");
const successMsg = ref("");
const loading = ref(false);

function validate() {
  errors.fullName = "";
  errors.email = "";
  errors.password = "";
  let ok = true;
  if (!form.fullName) {
    errors.fullName = "Họ tên không được để trống";
    ok = false;
  }
  if (!form.email) {
    errors.email = "Email không được để trống";
    ok = false;
  }
  if (!form.password || form.password.length < 6) {
    errors.password = "Mật khẩu tối thiểu 6 ký tự";
    ok = false;
  }
  return ok;
}

async function handleRegister() {
  if (!validate()) return;
  loading.value = true;
  errorMsg.value = "";
  successMsg.value = "";
  try {
    await authStore.register(form);
    successMsg.value = "Đăng ký thành công! Đang chuyển hướng...";
    setTimeout(() => router.push("/login"), 1500);
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || "Đăng ký thất bại";
  } finally {
    loading.value = false;
  }
}
</script>
