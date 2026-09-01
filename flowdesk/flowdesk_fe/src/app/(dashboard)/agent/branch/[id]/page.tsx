"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, MessageSquareIcon, CheckSquareIcon, ClockIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BranchWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const branch = user?.workspaces?.find((w) => w.workspaceId === Number(id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {branch?.workspaceName ?? "Chi nhánh"}
            </h1>
            <Badge variant="outline" className="text-xs font-mono">
              /{branch?.workspaceSlug}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Không gian làm việc nhân viên tư vấn & chăm sóc khách hàng
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 self-start sm:self-auto py-1 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Sẵn sàng tư vấn
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/80 bg-card/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UsersIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Khách hàng thuộc chi nhánh</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-card/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hội thoại</CardTitle>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <MessageSquareIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Đang chờ tư vấn</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 bg-card/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công việc</CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CheckSquareIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Nhiệm vụ trong ngày</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <SparklesIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Hộp thư hội thoại chi nhánh</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
              Tất cả cuộc hội thoại và ticket chăm sóc khách hàng mới sẽ hiển thị tại đây khi có phát sinh.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

