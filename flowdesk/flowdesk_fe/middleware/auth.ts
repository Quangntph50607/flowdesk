export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie("access_token");
  if (!token.value) {
    return navigateTo("/login");
  }

  const authStore = useAuthStore();
  if (!authStore.currentUser) {
    await authStore.fetchMe();
  }

  if (!authStore.currentUser) {
    return navigateTo("/login");
  }

  const needsWorkspace =
    !authStore.isSuperAdmin && authStore.myWorkspaces.length === 0;

  if (needsWorkspace && to.path !== "/setup-workspace") {
    return navigateTo("/setup-workspace");
  }

  if (!needsWorkspace && to.path === "/setup-workspace") {
    return navigateTo("/dashboard");
  }
});
