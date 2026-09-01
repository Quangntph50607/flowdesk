"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { workspaceService } from "@/services/workspace.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, BuildingIcon, ActivityIcon, ArrowUpRightIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Chờ zustand hydrate xong (user vẫn null nghĩa là chưa hydrate)
    if (user === null) return;

    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (user.systemRole === "SUPER_ADMIN") return;

    const isOwnerOrAdmin = user.workspaces?.some(
      (w) =>
        (w.roleCode === "OWNER" || w.roleCode === "ADMIN") &&
        w.parentId === null,
    );
    if (isOwnerOrAdmin) {
      router.replace("/admin-workspace");
      return;
    }

    const isAgent = user.workspaces?.some((w) => w.roleCode === "AGENT");
    if (isAgent) {
      router.replace("/agent");
      return;
    }

    router.replace("/welcome");
  }, [user, isAuthenticated, router]);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users-overview"],
    queryFn: () => userService.adminGetAll(),
    enabled: user?.systemRole === "SUPER_ADMIN",
  });

  const { data: workspaces, isLoading: wsLoading } = useQuery({
    queryKey: ["admin-workspaces-overview"],
    queryFn: () => workspaceService.adminGetAll(),
    enabled: user?.systemRole === "SUPER_ADMIN",
  });

  if (!user || user.systemRole !== "SUPER_ADMIN") return null;

  const totalUsers = users?.length ?? 0;
  const activeUsers = users?.filter((u) => u.isActive).length ?? 0;
  const totalWorkspaces = workspaces?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Tổng quan hệ thống
        </h1>
        <p className="text-muted-foreground mt-0.5">Xin chào, {user?.fullName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/users" className="block group">
          <Card className="rounded-2xl border-border/80 bg-card/80 hover:border-primary/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <UsersIcon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-foreground">{totalUsers}</span>
                    <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeUsers} tài khoản đang hoạt động
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/workspaces" className="block group">
          <Card className="rounded-2xl border-border/80 bg-card/80 hover:border-primary/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspace</CardTitle>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                <BuildingIcon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {wsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-foreground">{totalWorkspaces}</span>
                    <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tổng số không gian doanh nghiệp
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Card className="rounded-2xl border-border/80 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái hệ thống</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ActivityIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">100%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Các dịch vụ đang ổn định</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

