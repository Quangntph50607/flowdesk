"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, GitBranchIcon, MessageSquareIcon, ArrowUpRightIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["members-overview", workspace?.workspaceId],
    queryFn: () => workspaceService.getMembers(workspace!.workspaceId),
    enabled: !!workspace,
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches-overview", workspace?.workspaceId],
    queryFn: () => workspaceService.getBranches(workspace!.workspaceId),
    enabled: !!workspace,
  });

  if (!user || !workspace) return null;

  const totalMembers = members?.length ?? 0;
  const activeMembers = members?.filter((m) => m.isActive).length ?? 0;
  const totalBranches = branches?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {workspace.workspaceName}
        </h1>
        <p className="text-muted-foreground mt-0.5">
          {workspace.roleCode === "OWNER" ? "Chủ workspace" : "Quản trị viên"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin-workspace/members" className="block group">
          <Card className="rounded-2xl border-border/80 bg-card/80 hover:border-primary/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thành viên</CardTitle>
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <UsersIcon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-foreground">{totalMembers}</span>
                    <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeMembers} người dùng hoạt động
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin-workspace/branches" className="block group">
          <Card className="rounded-2xl border-border/80 bg-card/80 hover:border-primary/40 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chi nhánh</CardTitle>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                <GitBranchIcon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {branchesLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-foreground">{totalBranches}</span>
                    <ArrowUpRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chi nhánh trực thuộc workspace
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Card className="rounded-2xl border-border/80 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hội thoại</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <MessageSquareIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">0</div>
            <p className="text-xs text-muted-foreground mt-1">Chưa có hội thoại mới</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

