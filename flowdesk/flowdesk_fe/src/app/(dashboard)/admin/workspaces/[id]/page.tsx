"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GitBranchIcon,
  MoreHorizontalIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  ArrowLeftIcon,
} from "lucide-react";
import Link from "next/link";
import type { Workspace } from "@/types";

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ── Dialog tạo / sửa chi nhánh ───────────────────────────────
function BranchDialog({
  open,
  onClose,
  workspaceId,
  branch,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: number;
  branch?: Workspace;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!branch;

  const [name, setName] = useState(branch?.name ?? "");
  const [slug, setSlug] = useState(branch?.slug ?? "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      workspaceService.createBranch(workspaceId, {
        name: name.trim(),
        slug: slug.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      workspaceService.updateBranch(workspaceId, branch!.id, {
        name: name.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Tên không được để trống");
      return;
    }
    if (!isEdit && !slug.trim()) {
      setError("Slug không được để trống");
      return;
    }
    isEdit ? updateMutation.mutate() : createMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Chỉnh sửa chi nhánh" : "Tạo chi nhánh mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="branch-name">Tên chi nhánh</Label>
              <Input
                id="branch-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugManual) setSlug(toSlug(e.target.value));
                }}
                placeholder="VD: Chi nhánh Hà Nội"
              />
            </div>

            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="branch-slug">Slug</Label>
                <Input
                  id="branch-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    );
                  }}
                  placeholder="VD: chi-nhanh-ha-noi"
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Đang lưu..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Tạo chi nhánh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Branch card ───────────────────────────────────────────────
function BranchCard({
  branch,
  workspaceId,
  onEdit,
  onDelete,
}: {
  branch: Workspace;
  workspaceId: number;
  onEdit: (b: Workspace) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-950">
          <GitBranchIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{branch.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">/{branch.slug}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={branch.isActive ? "success" : "destructive"}>
          {branch.isActive ? "Hoạt động" : "Đã tắt"}
        </Badge>
        <Link href={`/workspace/${branch.id}/members`}>
          <Button variant="outline" size="sm" className="text-xs h-7">
            <UsersIcon className="size-3" />
            Thành viên
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-7" />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(branch)}>
              <PencilIcon className="size-3.5" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(branch.id)}
            >
              <Trash2Icon className="size-3.5" /> Xoá chi nhánh
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const workspaceId = Number(id);
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Workspace | undefined>();

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceService.getById(workspaceId),
    enabled: !!workspaceId,
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (branchId: number) =>
      workspaceService.deleteBranch(workspaceId, branchId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
  });

  const openCreate = () => {
    setEditingBranch(undefined);
    setDialogOpen(true);
  };
  const openEdit = (b: Workspace) => {
    setEditingBranch(b);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <PageHeader
          crumbs={[{ label: "Workspace", href: "/admin/workspaces" }]}
          title="..."
        />
        <div className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        crumbs={[{ label: "Workspace", href: "/admin/workspaces" }]}
        title={workspace.name}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Info */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">{workspace.name}</h2>
              <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={workspace.isActive ? "success" : "destructive"}>
                {workspace.isActive ? "Hoạt động" : "Đã tắt"}
              </Badge>
              <Link href={`/admin/workspaces/${workspaceId}/edit`}>
                <Button variant="outline" size="sm">
                  <PencilIcon className="size-3.5" /> Chỉnh sửa
                </Button>
              </Link>
              <Link href={`/workspace/${workspaceId}/members`}>
                <Button variant="outline" size="sm">
                  <UsersIcon className="size-3.5" /> Thành viên
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Branches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              Chi nhánh ({workspace.children?.length ?? 0})
            </h3>
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4" /> Thêm chi nhánh
            </Button>
          </div>

          {!workspace.children || workspace.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-12 text-center">
              <GitBranchIcon className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">Chưa có chi nhánh</p>
              <p className="text-xs text-muted-foreground mt-1">
                Thêm chi nhánh đầu tiên
              </p>
              <Button size="sm" className="mt-3" onClick={openCreate}>
                <PlusIcon className="size-4" /> Thêm chi nhánh
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {workspace.children.map((branch) => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  workspaceId={workspaceId}
                  onEdit={openEdit}
                  onDelete={(bid) => deleteBranchMutation.mutate(bid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BranchDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        workspaceId={workspaceId}
        branch={editingBranch}
      />
    </div>
  );
}
