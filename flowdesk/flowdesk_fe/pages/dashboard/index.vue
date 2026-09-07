<template>
  <div class="fd-page">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8"
    >
      <div>
        <div class="flex items-center gap-3 mb-2">
          <span class="fd-breadcrumb">Overview</span>
          <span class="fd-live-badge">
            <span class="fd-live-dot" />
            Live
          </span>
        </div>
        <h1 class="fd-page-title">Dashboard</h1>
        <p class="fd-page-subtitle">
          Xin chào,
          <span class="font-semibold" style="color: #334155">{{
            authStore.currentUser?.fullName
          }}</span>
          — quản lý workspace và thành viên của bạn.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="fd-search">
          <i class="pi pi-search" style="font-size: 14px" />
          <input
            type="text"
            placeholder="Search..."
            class="bg-transparent border-none outline-none flex-1 text-sm"
            style="color: #334155"
          />
        </div>
        <button
          class="flex items-center justify-center rounded-xl transition-colors"
          style="
            width: 40px;
            height: 40px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #64748b;
          "
        >
          <i class="pi pi-bell" style="font-size: 15px" />
        </button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="fd-stat-card">
        <span class="fd-stat-label">{{ stat.label }}</span>
        <p class="fd-stat-value">{{ stat.value }}</p>
        <div class="fd-stat-icon">
          <i :class="stat.icon" />
        </div>
        <span :class="['fd-trend-badge', stat.trendClass]">
          <i :class="stat.trendIcon" style="font-size: 10px" />
          {{ stat.trend }}
        </span>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="fd-card">
        <div class="fd-card-header">
          <h2 class="text-base font-semibold" style="color: #0f172a">
            Truy cập nhanh
          </h2>
          <p class="text-sm mt-0.5" style="color: #64748b">
            Điều hướng đến các trang quản lý chính
          </p>
        </div>
        <div class="fd-card-body flex flex-col gap-2">
          <NuxtLink
            v-for="link in quickLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 rounded-xl px-4 py-3 no-underline transition-colors"
            style="border: 1px solid #f1f5f9"
            @mouseenter="
              (e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  '#f8fafc')
            "
            @mouseleave="
              (e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  'transparent')
            "
          >
            <div
              class="flex items-center justify-center rounded-xl shrink-0"
              :style="{
                width: '40px',
                height: '40px',
                backgroundColor: link.bg,
                color: link.color,
              }"
            >
              <i :class="link.icon" style="font-size: 16px" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold" style="color: #0f172a">
                {{ link.label }}
              </p>
              <p class="text-xs truncate" style="color: #94a3b8">
                {{ link.desc }}
              </p>
            </div>
            <i
              class="pi pi-arrow-right"
              style="font-size: 12px; color: #cbd5e1"
            />
          </NuxtLink>
        </div>
      </div>

      <div class="fd-card">
        <div class="fd-card-header">
          <h2 class="text-base font-semibold" style="color: #0f172a">
            Thông tin tài khoản
          </h2>
          <p class="text-sm mt-0.5" style="color: #64748b">
            Chi tiết phiên đăng nhập hiện tại
          </p>
        </div>
        <div class="fd-card-body">
          <div class="flex items-center gap-4 mb-5">
            <div
              class="flex items-center justify-center rounded-2xl font-bold text-lg shrink-0"
              style="
                width: 56px;
                height: 56px;
                background-color: #0f172a;
                color: #ffffff;
              "
            >
              {{ userInitial }}
            </div>
            <div>
              <p class="font-semibold text-base" style="color: #0f172a">
                {{ authStore.currentUser?.fullName }}
              </p>
              <p class="text-sm" style="color: #64748b">
                {{ authStore.currentUser?.email }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              class="rounded-xl px-4 py-3"
              style="background-color: #f8fafc; border: 1px solid #f1f5f9"
            >
              <p class="text-xs font-medium" style="color: #94a3b8">Vai trò</p>
              <p class="text-sm font-semibold mt-0.5" style="color: #0f172a">
                {{
                  authStore.currentUser?.systemRole ??
                  authStore.myWorkspaces[0]?.roleCode ??
                  "—"
                }}
              </p>
            </div>
            <div
              class="rounded-xl px-4 py-3"
              style="background-color: #f8fafc; border: 1px solid #f1f5f9"
            >
              <p class="text-xs font-medium" style="color: #94a3b8">
                Trạng thái
              </p>
              <p class="text-sm font-semibold mt-0.5" style="color: #16a34a">
                Hoạt động
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const authStore = useAuthStore();

const userInitial = computed(
  () => authStore.currentUser?.fullName?.charAt(0).toUpperCase() ?? "U",
);

const stats = [
  {
    label: "Workspaces",
    value: "—",
    icon: "pi pi-briefcase",
    trend: "Đang tải",
    trendIcon: "pi pi-minus",
    trendClass: "fd-trend-badge--neutral",
  },
  {
    label: "Thành viên",
    value: "—",
    icon: "pi pi-users",
    trend: "Đang tải",
    trendIcon: "pi pi-minus",
    trendClass: "fd-trend-badge--neutral",
  },
  {
    label: "Tasks",
    value: "—",
    icon: "pi pi-check-square",
    trend: "Sắp ra mắt",
    trendIcon: "pi pi-clock",
    trendClass: "fd-trend-badge--neutral",
  },
];

const quickLinks = computed(() => {
  const links = [
    {
      to: "/dashboard/workspaces",
      label: "Workspaces",
      desc: "Quản lý và tạo workspace mới",
      icon: "pi pi-briefcase",
      bg: "#eff6ff",
      color: "#3b82f6",
    },
  ];
  if (authStore.isSuperAdmin) {
    links.push({
      to: "/dashboard/users",
      label: "Users",
      desc: "Quản lý người dùng hệ thống",
      icon: "pi pi-users",
      bg: "#f0fdf4",
      color: "#22c55e",
    });
  }
  return links;
});
</script>
