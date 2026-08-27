"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BuildingIcon,
  GitBranchIcon,
  MoreHorizontalIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import type { Workspace } from "@/types";

function WorkspaceCard({
  ws,
  onDelete,
}: {
  ws: Workspace;
  onDelete: (id: number) => void;
}) {
  const router = useRouter();
  
  return (
    <div
      className="rounded-xl border bg-card p-5 shadow-sm space-y-4"
      onClick={() => router.push(`/admin/workspaces/${ws.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
            <BuildingIcon className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="font-medium text-sm leading-none">{ws.name}</p>
            <p className="text-xs text-muted-foreground mt-1">/{ws.slug}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="size-7 shrink-0" />
            }
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={<Link href={`/admin/workspaces/${ws.id}`} />}
            >
              Xem chi tiết
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href={`/admin/workspaces/${ws.id}/edit`} />}
            >
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(ws.id)}
            >
              Xoá workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <GitBranchIcon className="size-3" />
          {ws.children?.length ?? 0} chi nhánh
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
            ws.isActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {ws.isActive ? "Hoạt động" : "Đã tắt"}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <Link href={`/admin/workspaces/${ws.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs">
            <GitBranchIcon className="size-3" /> Chi nhánh
          </Button>
        </Link>
        <Link href={`/workspace/${ws.id}/members`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs">
            <UsersIcon className="size-3" /> Thành viên
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["admin", "workspaces"],
    queryFn: workspaceService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workspaceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
      setDeletingId(null);
    },
  });

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        crumbs={[{ label: "Tổng quan", href: "/dashboard" }]}
        title="Quản lý Workspace"
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `${workspaces.length} workspace`}
          </p>
          <Link href="/admin/workspaces/create">
            <Button size="sm">
              <PlusIcon className="size-4" /> Tạo Workspace
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border h-40 animate-pulse bg-muted"
              />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-20 text-center">
            <BuildingIcon className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Chưa có workspace nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tạo workspace đầu tiên để bắt đầu
            </p>
            <Link href="/admin/workspaces/create" className="mt-4">
              <Button size="sm">
                <PlusIcon className="size-4" /> Tạo Workspace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                ws={ws}
                onDelete={(id) => setDeletingId(id)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isPending={deleteMutation.isPending}
        title="Xoá workspace"
        description="Workspace và toàn bộ chi nhánh sẽ bị ẩn đi (soft delete). Bạn có chắc chắn?"
        confirmLabel="Xoá"
      />
    </div>
  );
}
