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
    // Danh sách workspace tổng (level 0) mà user là OWNER/ADMIN
    myWorkspaces: (state): WorkspaceInfo[] =>
      state.user?.workspaces?.filter((w) => w.parentId === null) ?? [],
  },

  actions: {
    async login(email: string, password: string) {
      const api = useApi();
      const res = await api.post("/api/auth/login", { email, password });
      const { accessToken, refreshToken, user } = res.data.data;

      useCookie("access_token", { maxAge: 60 * 60 }).value = accessToken;
      useCookie("refresh_token", { maxAge: 60 * 60 * 24 * 7 }).value =
        refreshToken;
      this.user = user;
    },

    async register(payload: {
      email: string;
      password: string;
      fullName: string;
    }) {
      const api = useApi();
      const res = await api.post("/api/auth/register", payload);
      return res.data;
    },

    async fetchMe() {
      try {
        const api = useApi();
        const res = await api.get("/api/me");
        this.user = res.data.data;
      } catch {
        this.user = null;
      }
    },

    async logout() {
      try {
        const refreshToken = useCookie("refresh_token");
        if (refreshToken.value) {
          const api = useApi();
          await api.post("/api/auth/logout", {
            refreshToken: refreshToken.value,
          });
        }
      } catch {
        /* ignore */
      }
      useCookie("access_token").value = null;
      useCookie("refresh_token").value = null;
      this.user = null;
      await navigateTo("/login");
    },
  },
});
