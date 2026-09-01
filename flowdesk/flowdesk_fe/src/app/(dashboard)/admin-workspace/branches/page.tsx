"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon, GitBranchIcon, UsersIcon, ExternalLinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { CreateBranchDialog } from "@/components/workspaces/create-branch-dialog";

export default function BranchesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const workspace = user?.workspaces?.find(
    (w) =>
      (w.roleCode === "OWNER" || w.roleCode === "ADMIN") && w.parentId === null,
  );

  useEffect(() => {
    if (user === null) return;
    if (!workspace) router.replace("/admin-workspace");
  }, [user, workspace, router]);

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches", workspace?.workspaceId],
    queryFn: () => workspaceService.getBranches(workspace!.workspaceId),
    enabled: !!workspace,
  });

  if (!user || !workspace) return null;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Quản lý Chi nhánh
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Danh sách chi nhánh thuộc workspace <span className="font-medium text-foreground">{workspace.workspaceName}</span>
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:opacity-95 text-white shadow-md shadow-primary/20 shrink-0"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Thêm chi nhánh
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : branches?.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <GitBranchIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Chưa có chi nhánh nào trong workspace này</p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                className="rounded-xl border-border hover:bg-muted mt-1"
              >
                <PlusIcon className="mr-2 h-4 w-4" /> Tạo chi nhánh đầu tiên
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {branches?.map((branch) => (
              <Card
                key={branch.id}
                className="rounded-2xl border-border/80 bg-card/80 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all group"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <GitBranchIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{branch.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">/{branch.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-8 text-xs border-border flex-1 hover:border-primary/40"
                      render={
                        <Link href={`/admin-workspace/branches/${branch.id}`} />
                      }
                    >
                      <ExternalLinkIcon className="h-3 w-3 mr-1 text-muted-foreground" /> Chi tiết
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl h-8 text-xs border-border flex-1 gap-1 hover:border-primary/40"
                      render={
                        <Link
                          href={`/admin-workspace/branches/${branch.id}/members`}
                        />
                      }
                    >
                      <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" /> Thành viên
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateBranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspace.workspaceId}
        workspaceName={workspace.workspaceName}
      />
    </>
  );
}
