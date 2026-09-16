<template>
  <div class="fd-shell">
    <!-- Sidebar icon-only, light style -->
    <aside class="fd-sidebar">
      <!-- Logo -->
      <div
        class="flex items-center justify-center shrink-0 mb-4"
        style="height: 52px"
      >
        <div
          class="flex items-center justify-center rounded-xl"
          style="width: 40px; height: 40px; background-color: #0f172a"
        >
          <i class="pi pi-th-large" style="color: #ffffff; font-size: 14px" />
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 flex flex-col items-center" style="gap: 4px">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          v-tooltip.right="{ value: item.label, showDelay: 100 }"
          :class="[
            'fd-nav-item',
            isActive(item.to) ? 'fd-nav-item--active' : '',
          ]"
          style="position: relative"
        >
          <i :class="item.icon" style="font-size: 16px" />
          <!-- Unread badge (chat) -->
          <span
            v-if="item.badge && item.badge > 0"
            style="
              position: absolute;
              top: 4px;
              right: 4px;
              min-width: 16px;
              height: 16px;
              background: #ef4444;
              color: #fff;
              border-radius: 9999px;
              font-size: 9px;
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 3px;
              line-height: 1;
            "
            >{{ item.badge > 99 ? "99+" : item.badge }}</span
          >
        </NuxtLink>
      </nav>

      <!-- Bottom -->
      <div class="shrink-0 flex flex-col items-center pb-2" style="gap: 4px">
        <button
          class="fd-nav-item"
          aria-haspopup="true"
          aria-controls="user_menu"
          @click="toggleUserMenu"
        >
          <div
            v-if="authStore.currentUser?.avatarUrl"
            class="rounded-full shrink-0 overflow-hidden"
            style="width: 36px; height: 36px; border: 2px solid #e2e8f0"
          >
            <img
              :src="authStore.currentUser.avatarUrl"
              :alt="authStore.currentUser.fullName"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="flex items-center justify-center rounded-full font-bold"
            style="
              width: 36px;
              height: 36px;
              background-color: #f1f5f9;
              color: #475569;
              font-size: 13px;
              border: 2px solid #e2e8f0;
            "
          >
            {{ userInitial }}
          </div>
        </button>

        <Menu
          ref="userMenu"
          id="user_menu"
          :model="userMenuItems"
          :popup="true"
          class="fd-user-menu"
        >
          <template #start>
            <div class="fd-user-menu-header">
              <div
                v-if="authStore.currentUser?.avatarUrl"
                class="rounded-full shrink-0 overflow-hidden"
                style="width: 40px; height: 40px"
              >
                <img
                  :src="authStore.currentUser.avatarUrl"
                  :alt="authStore.currentUser.fullName"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="flex items-center justify-center rounded-full font-bold shrink-0"
                style="
                  width: 40px;
                  height: 40px;
                  background-color: #0f172a;
                  color: #ffffff;
                  font-size: 14px;
                "
              >
                {{ userInitial }}
              </div>
              <div class="min-w-0">
                <p
                  class="font-semibold text-sm truncate"
                  style="color: #0f172a"
                >
                  {{ authStore.currentUser?.fullName }}
                </p>
                <p class="text-xs truncate" style="color: #64748b">
                  {{ authStore.currentUser?.email }}
                </p>
              </div>
            </div>
          </template>
        </Menu>
      </div>
    </aside>

    <!-- Main white container -->
    <main class="fd-content-shell">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chat";

const authStore = useAuthStore();
const chatStore = useChatStore();
const route = useRoute();
const userMenu = ref();

const navItems = computed(() => {
  const items: { to: string; label: string; icon: string; badge?: number }[] = [
    { to: "/dashboard", label: "Dashboard", icon: "pi pi-home" },
    {
      to: "/dashboard/workspaces",
      label: "Workspaces",
      icon: "pi pi-briefcase",
    },
    // Chat — route cố định, page tự resolve workspaceId
    {
      to: "/dashboard/chat",
      label: "Chat nội bộ",
      icon: "pi pi-comments",
      badge: chatStore.unreadTotal > 0 ? chatStore.unreadTotal : undefined,
    },
  ];

  if (authStore.isSuperAdmin) {
    items.push({ to: "/dashboard/users", label: "Users", icon: "pi pi-users" });
  }
  return items;
});

const userInitial = computed(
  () => authStore.currentUser?.fullName?.charAt(0).toUpperCase() ?? "U",
);

const userMenuItems = computed(() => [
  {
    label: "Đăng xuất",
    icon: "pi pi-sign-out",
    command: () => authStore.logout(),
  },
]);

function toggleUserMenu(event: Event) {
  userMenu.value?.toggle(event);
}

function isActive(to: string) {
  if (to === "/dashboard") return route.path === "/dashboard";
  return route.path.startsWith(to);
}

onMounted(async () => {
  if (!authStore.currentUser) {
    await authStore.fetchMe();
  }
});
</script>
