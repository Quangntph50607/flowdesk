"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/store/auth.store";
import {
  UsersIcon,
  BuildingIcon,
  GitBranchIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
  SparklesIcon,
  ActivityIcon,
  CheckCircle2Icon,
} from "lucide-react";

const stats = [
  {
    label: "Tổng người dùng",
    value: "—",
    icon: UsersIcon,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    glow: "shadow-blue-500/5",
  },
  {
    label: "Workspace",
    value: "—",
    icon: BuildingIcon,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    glow: "shadow-cyan-500/5",
  },
  {
    label: "Chi nhánh",
    value: "—",
    icon: GitBranchIcon,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    glow: "shadow-emerald-500/5",
  },
  {
    label: "Nhân viên",
    value: "—",
    icon: ShieldCheckIcon,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    glow: "shadow-amber-500/5",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader title="Tổng quan" />

      <div className="flex-1 space-y-8 p-6 md:p-8 max-w-7xl w-full mx-auto">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-8 text-white shadow-xl shadow-blue-950/20 border border-blue-500/20">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-blue-200 border border-white/10">
                <SparklesIcon className="size-3.5 text-amber-400" />
                <span>Super Admin Portal</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Xin chào, {user?.fullName ?? "Admin"} 👋
              </h1>
              <p className="text-sm text-blue-200/80 max-w-xl">
                Đây là bảng điều khiển hệ thống Flowdesk. Quản lý người dùng,
                theo dõi workspace và cấu hình chi nhánh công ty dễ dàng.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-lg bg-white/5 backdrop-blur-md p-4 border border-white/10 text-right">
                <p className="text-xs text-blue-300/80">Trạng thái hệ thống</p>
                <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-emerald-400">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                  </span>
                  Hoạt động tốt
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Chỉ số chính
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`group rounded-lg border border-border/80 bg-card p-6 shadow-sm ${stat.glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/30`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <div
                    className={`rounded-lg border p-2.5 transition-transform duration-300 group-hover:scale-110 ${stat.bg}`}
                  >
                    <stat.icon className={`size-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <p className="text-3xl font-extrabold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Sẵn sàng
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions & Overview Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Thao tác nhanh
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickAction
                href="/admin/users"
                icon={UsersIcon}
                label="Quản lý người dùng"
                desc="Xem danh sách, sửa thông tin & khoá tài khoản"
                color="text-blue-600 dark:text-blue-400"
                bg="bg-blue-500/10 border-blue-500/20"
              />
              <QuickAction
                href="/admin/workspaces"
                icon={BuildingIcon}
                label="Quản lý Workspace"
                desc="Danh sách workspace công ty & chi nhánh"
                color="text-cyan-600 dark:text-cyan-400"
                bg="bg-cyan-500/10 border-cyan-500/20"
              />
              <QuickAction
                href="/admin/workspaces/create"
                icon={GitBranchIcon}
                label="Tạo Workspace mới"
                desc="Khởi tạo công ty mới trong hệ thống"
                color="text-emerald-600 dark:text-emerald-400"
                bg="bg-emerald-500/10 border-emerald-500/20"
              />
              <QuickAction
                href="/profile"
                icon={ShieldCheckIcon}
                label="Cấu hình cá nhân"
                desc="Cập nhật avatar, tên hiển thị & mật khẩu"
                color="text-amber-600 dark:text-amber-400"
                bg="bg-amber-500/10 border-amber-500/20"
              />
            </div>
          </div>

          {/* Quick System Info Panel */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Thông tin phiên
            </h2>
            <div className="rounded-lg border border-border/80 bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <ActivityIcon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Flowdesk Core API
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Version 1.0.0 Stable
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Quyền hạn:</span>
                  <span className="font-semibold text-foreground bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                    {user?.systemRole ?? "SUPER_ADMIN"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tài khoản:</span>
                  <span className="font-medium text-foreground truncate max-w-[160px]">
                    {user?.email ?? "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Bảo mật 2FA:</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2Icon className="size-3.5" /> Bật
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  desc,
  color,
  bg,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  bg: string;
}) {
  return (
    <a
      href={href}
      className="group relative flex items-start gap-4 rounded-lg border border-border/80 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-500/30"
    >
      <span
        className={`shrink-0 rounded-lg border p-3 transition-transform duration-300 group-hover:scale-110 ${bg}`}
      >
        <Icon className={`size-5 ${color}`} />
      </span>
      <div className="space-y-1 pr-4">
        <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {label}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      <ArrowUpRightIcon className="absolute top-5 right-5 size-4 text-muted-foreground/40 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
    </a>
  );
}
