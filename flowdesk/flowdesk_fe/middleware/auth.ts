export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();
  const accessToken = useAccessTokenCookie();
  const refreshToken = useRefreshTokenCookie();

  if (!accessToken.value && refreshToken.value) {
    await authStore.refreshSession();
  }

  if (!accessToken.value) {
    return navigateTo("/login");
  }

  if (!authStore.currentUser) {
    const fetched = await authStore.fetchMe();
    if (!fetched && refreshToken.value) {
      const refreshed = await authStore.refreshSession();
      if (refreshed) {
        await authStore.fetchMe();
      }
    }
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
