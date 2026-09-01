"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, BuildingIcon, ActivityIcon } from "lucide-react";

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

  if (!user || user.systemRole !== "SUPER_ADMIN") return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tổng quan hệ thống
        </h1>
        <p className="text-muted-foreground">Xin chào, {user?.fullName}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Tổng số tài khoản</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspace</CardTitle>
            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Tổng số workspace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Trong 24 giờ qua</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
