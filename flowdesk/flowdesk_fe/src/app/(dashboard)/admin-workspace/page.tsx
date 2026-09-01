"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, GitBranchIcon, MessageSquareIcon } from "lucide-react";

export default function AdminWorkspacePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user === null) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const isOwnerOrAdmin = user.workspaces?.some(
      (w) =>
        (w.roleCode === "OWNER" || w.roleCode === "ADMIN") &&
        w.parentId === null,
    );
    if (!isOwnerOrAdmin) {
      router.replace("/agent");
    }
  }, [user, isAuthenticated, router]);

  const workspace = user?.workspaces?.find(
    (w) =>
      (w.roleCode === "OWNER" || w.roleCode === "ADMIN") && w.parentId === null,
  );

  if (!user || !workspace) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {workspace.workspaceName}
        </h1>
        <p className="text-muted-foreground">
          {workspace.roleCode === "OWNER" ? "Chủ workspace" : "Quản trị viên"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành viên</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Tổng số thành viên</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi nhánh</CardTitle>
            <GitBranchIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              Số chi nhánh hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hội thoại</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Đang mở</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
