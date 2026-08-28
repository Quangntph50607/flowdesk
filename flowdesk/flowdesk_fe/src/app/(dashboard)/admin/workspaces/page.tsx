"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SearchIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
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
    <div className="group relative rounded-lg border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-cyan-500/30 flex flex-col justify-between space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex items-center gap-3.5 cursor-pointer"
          onClick={() => router.push(`/admin/workspaces/${ws.id}`)}
        >
          <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-transform duration-300 group-hover:scale-105">
            <BuildingIcon className="size-5" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight text-foreground transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
              {ws.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              /{ws.slug}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg">
            <DropdownMenuItem
              onClick={() => router.push(`/admin/workspaces/${ws.id}`)}
              className="cursor-pointer gap-2"
            >
              <ExternalLinkIcon className="size-3.5 text-blue-500" /> Xem chi
              tiết
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/admin/workspaces/${ws.id}/edit`)}
              className="cursor-pointer gap-2"
            >
              <PencilIcon className="size-3.5 text-amber-500" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(ws.id)}
              className="cursor-pointer gap-2"
            >
              <Trash2Icon className="size-3.5 text-rose-500" /> Xoá workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <GitBranchIcon className="size-3.5 text-blue-500" />
          {ws.children?.length ?? 0} chi nhánh
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium border ${
            ws.isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${ws.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
          />
          {ws.isActive ? "Hoạt động" : "Đã tắt"}
        </span>
      </div>

      <div className="flex gap-2.5 pt-1">
        <Link href={`/admin/workspaces/${ws.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 rounded-lg text-xs font-medium border-border/80 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            <GitBranchIcon className="size-3.5 mr-1" /> Chi nhánh
          </Button>
        </Link>
        <Link href={`/workspace/${ws.id}/members`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 rounded-lg text-xs font-medium border-border/80 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <UsersIcon className="size-3.5 mr-1" /> Thành viên
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ws.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[{ label: "Tổng quan", href: "/dashboard" }]}
        title="Quản lý Workspace"
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Danh sách Workspace
            </h1>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Đang tải dữ liệu..."
                : `Hiển thị ${filteredWorkspaces.length} trên tổng số ${workspaces.length} workspace`}
            </p>
          </div>

          <Link href="/admin/workspaces/create">
            <Button
              size="sm"
              className="rounded-lg h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20"
            >
              <PlusIcon className="size-4 mr-1.5" /> Tạo Workspace
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm workspace theo tên hoặc slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-lg border-border/80 bg-card"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/60 h-44 animate-pulse bg-muted/60"
              />
            ))}
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border/80 bg-card py-20 px-4 text-center shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 mb-4">
              <BuildingIcon className="size-7" />
            </div>
            <p className="text-base font-bold text-foreground">
              Chưa có workspace nào
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Tạo workspace đầu tiên để bắt đầu quản lý công ty và phân quyền
              các chi nhánh.
            </p>
            <Link href="/admin/workspaces/create" className="mt-6">
              <Button
                size="sm"
                className="rounded-lg h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                <PlusIcon className="size-4 mr-1.5" /> Tạo Workspace ngay
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkspaces.map((ws) => (
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
        confirmLabel="Xoá workspace"
      />
    </div>
  );
}
