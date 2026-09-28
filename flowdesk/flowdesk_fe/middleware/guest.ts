export default defineNuxtRouteMiddleware(async () => {
  const token = useCookie("access_token");
  if (token.value) {
    const authStore = useAuthStore();
    if (!authStore.currentUser) {
      await authStore.fetchMe();
    }

    if (
      authStore.currentUser &&
      !authStore.isSuperAdmin &&
      authStore.myWorkspaces.length === 0
    ) {
      return navigateTo("/setup-workspace");
    }

    return navigateTo("/dashboard");
  }
});
