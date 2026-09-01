"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, MessageSquareIcon, CheckSquareIcon } from "lucide-react";

export default function BranchWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const branch = user?.workspaces?.find((w) => w.workspaceId === Number(id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {branch?.workspaceName ?? "Chi nhánh"}
        </h1>
        <p className="text-muted-foreground">Không gian làm việc của bạn</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Tổng số khách hàng</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công việc</CardTitle>
            <CheckSquareIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Cần làm hôm nay</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
