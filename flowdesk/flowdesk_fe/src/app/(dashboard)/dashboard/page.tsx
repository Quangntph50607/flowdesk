"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/store/auth.store";
import {
  UsersIcon,
  BuildingIcon,
  GitBranchIcon,
  ShieldCheckIcon,
} from "lucide-react";

const stats = [
  {
    label: "Tổng người dùng",
    value: "—",
    icon: UsersIcon,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  {
    label: "Workspace",
    value: "—",
    icon: BuildingIcon,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950",
  },
  {
    label: "Chi nhánh",
    value: "—",
    icon: GitBranchIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950",
  },
  {
    label: "Nhân viên",
    value: "—",
    icon: ShieldCheckIcon,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Tổng quan" />

      <div className="flex-1 space-y-6 p-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Xin chào, {user?.fullName ?? "Admin"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Đây là tổng quan hệ thống Flowdesk.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <span className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-base font-medium mb-3">Thao tác nhanh</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickAction
              href="/admin/users"
              icon={UsersIcon}
              label="Quản lý người dùng"
              desc="Xem, sửa, khoá tài khoản"
              color="text-blue-500"
              bg="bg-blue-50 dark:bg-blue-950"
            />
            <QuickAction
              href="/admin/workspaces"
              icon={BuildingIcon}
              label="Quản lý Workspace"
              desc="Tạo và quản lý công ty"
              color="text-violet-500"
              bg="bg-violet-50 dark:bg-violet-950"
            />
            <QuickAction
              href="/admin/workspaces/create"
              icon={GitBranchIcon}
              label="Tạo Workspace mới"
              desc="Thêm công ty vào hệ thống"
              color="text-emerald-500"
              bg="bg-emerald-50 dark:bg-emerald-950"
            />
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
      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
    >
      <span className={`rounded-lg p-2.5 ${bg}`}>
        <Icon className={`size-5 ${color}`} />
      </span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </a>
  );
}
