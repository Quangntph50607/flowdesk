import { defineStore } from "pinia";

interface WorkspaceInfo {
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  parentId: number | null;
  roleCode: "OWNER" | "ADMIN" | "AGENT";
}

interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  systemRole?: string | null;
  isActive?: boolean;
  workspaces?: WorkspaceInfo[];
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    currentUser: (state) => state.user,
    isSuperAdmin: (state) => state.user?.systemRole === "SUPER_ADMIN",
    isAdmin: (state) => state.user?.systemRole === "SUPER_ADMIN",
    hasWorkspaceAccess: (state) =>
      (state.user?.workspaces?.length ?? 0) > 0,
    primaryWorkspaceRole: (state) => state.user?.workspaces?.[0]?.roleCode,
    // Danh sách workspace tổng (level 0) mà user là OWNER/ADMIN
    myWorkspaces: (state): WorkspaceInfo[] =>
      state.user?.workspaces?.filter((w) => w.parentId === null) ?? [],
  },

  actions: {
    setSession(data: {
      accessToken: string;
      refreshToken: string;
      userId: number;
      email: string;
      fullName: string;
      avatarUrl?: string;
      phone?: string;
      address?: string;
      dateOfBirth?: string;
      systemRole?: string | null;
      workspaces?: WorkspaceInfo[];
    }) {
      useAccessTokenCookie().value = data.accessToken;
      useRefreshTokenCookie().value = data.refreshToken;
      this.user = {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
        systemRole: data.systemRole,
        workspaces: data.workspaces ?? [],
      };
    },

    async resolveAvatarUrl() {
      const avatarUrl = this.user?.avatarUrl;
      if (!avatarUrl || !avatarUrl.includes("backblazeb2.com")) {
        return;
      }

      try {
        const pathParts = new URL(avatarUrl).pathname
          .split("/")
          .filter(Boolean);
        const fileKey =
          pathParts[0] === "flowdesk-files"
            ? pathParts.slice(1).join("/")
            : pathParts.join("/");
        if (!fileKey) return;

        const api = useApi();
        const res = await api.get("/api/upload/presign", {
          params: { key: fileKey },
        });
        if (this.user) this.user.avatarUrl = res.data.data;
      } catch {
        // Keep the stored URL if presigning temporarily fails.
      }
    },

    async login(email: string, password: string) {
      const api = useApi();
      const res = await api.post("/api/auth/login", { email, password });
      this.setSession(res.data.data);
      await this.resolveAvatarUrl();
    },

    async register(payload: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      address?: string;
      dateOfBirth?: string;
    }) {
      const api = useApi();
      const res = await api.post("/api/auth/register", payload);
      this.setSession(res.data.data);
      return res.data.data;
    },

    async fetchMe() {
      try {
        const api = useApi();
        const res = await api.get("/api/me");
        this.user = res.data.data;
        await this.resolveAvatarUrl();
        return true;
      } catch {
        this.user = null;
        return false;
      }
    },

    async refreshSession() {
      const refreshToken = useRefreshTokenCookie();
      if (!refreshToken.value) {
        return false;
      }

      try {
        const api = useApi();
        const res = await api.post("/api/auth/refresh", {
          refreshToken: refreshToken.value,
        });
        this.setSession(res.data.data);
        await this.resolveAvatarUrl();
        return true;
      } catch {
        clearAuthCookies();
        this.user = null;
        return false;
      }
    },

    async logout() {
      try {
        const refreshToken = useRefreshTokenCookie();
        if (refreshToken.value) {
          const api = useApi();
          await api.post("/api/auth/logout", {
            refreshToken: refreshToken.value,
          });
        }
      } catch {
        /* ignore */
      }
      clearAuthCookies();
      this.user = null;
      await navigateTo("/login");
    },
  },
});
