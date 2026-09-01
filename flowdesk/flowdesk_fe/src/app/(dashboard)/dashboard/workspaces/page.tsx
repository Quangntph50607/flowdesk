"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusIcon,
  BuildingIcon,
  GitBranchIcon,
  Trash2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import type { Workspace } from "@/types";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";

function WorkspaceRow({
  ws,
  onDelete,
  isDeleting,
}: {
  ws: Workspace;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasBranches = (ws.children?.length ?? 0) > 0;

  return (
    <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/80 shadow-xs hover:border-primary/40 transition-all">
      <div className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
          disabled={!hasBranches}
        >
          {hasBranches ? (
            expanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )
          ) : (
            <BuildingIcon className="h-4 w-4 text-muted-foreground/40" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{ws.name}</p>
            <Badge variant="outline" className="text-[11px] font-mono shrink-0 border-primary/20 bg-primary/5 text-primary">
              /{ws.slug}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Owner: <span className="font-medium text-foreground">{ws.ownerName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasBranches && (
            <Badge variant="secondary" className="gap-1 text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
              <GitBranchIcon className="h-3 w-3" /> {ws.children!.length} chi nhánh
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-8 border-border text-xs hover:border-primary/40"
            render={<Link href={`/dashboard/workspaces/${ws.id}`} />}
          >
            <SettingsIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Chi tiết
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(ws.id)}
            disabled={isDeleting}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {expanded && hasBranches && (
        <div className="border-t border-border/60 bg-muted/20 divide-y divide-border/40">
          {ws.children!.map((branch) => (
            <div
              key={branch.id}
              className="flex items-center gap-4 px-4 py-3 pl-12 hover:bg-muted/40 transition-colors"
            >
              <GitBranchIcon className="h-4 w-4 text-cyan-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{branch.name}</p>
                <p className="text-xs text-muted-foreground font-mono">/{branch.slug}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminWorkspacesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (user === null) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (user.systemRole !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer.current);
  }, [search]);

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["admin-workspaces", debouncedSearch],
    queryFn: () => workspaceService.adminGetAll(debouncedSearch || undefined),
    enabled: user?.systemRole === "SUPER_ADMIN",
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workspaceService.adminDelete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] }),
  });

  if (!user || user.systemRole !== "SUPER_ADMIN") return null;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Quản lý Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Danh sách và thông tin chi tiết toàn bộ workspace hệ thống
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:opacity-95 text-white shadow-md shadow-primary/20 shrink-0"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Tạo workspace
          </Button>
        </div>

        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên workspace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : !workspaces?.length ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <BuildingIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">
                {search
                  ? "Không tìm thấy workspace nào khớp với từ khoá"
                  : "Chưa có workspace nào được tạo"}
              </p>
              {!search && (
                <Button
                  onClick={() => setDialogOpen(true)}
                  className="rounded-xl bg-primary text-primary-foreground shadow-xs mt-1"
                >
                  <PlusIcon className="mr-2 h-4 w-4" /> Tạo workspace đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws) => (
              <WorkspaceRow
                key={ws.id}
                ws={ws}
                onDelete={(id) => deleteMutation.mutate(id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
