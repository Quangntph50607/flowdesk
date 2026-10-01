export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore();
  const accessToken = useAccessTokenCookie();
  const refreshToken = useRefreshTokenCookie();

  if (!accessToken.value && refreshToken.value) {
    await authStore.refreshSession();
  }

  if (accessToken.value) {
    if (!authStore.currentUser) {
      await authStore.fetchMe();
    }

    if (!authStore.currentUser) {
      clearAuthCookies();
      return;
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
