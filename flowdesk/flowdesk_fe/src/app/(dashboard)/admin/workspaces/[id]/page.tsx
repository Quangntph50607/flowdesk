"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  BuildingIcon,
  GlobeIcon,
  CheckCircle2Icon,
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
      <DialogContent onClose={onClose} className="sm:max-w-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <GitBranchIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {isEdit ? "Chỉnh sửa chi nhánh" : "Tạo chi nhánh mới"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Phân cấp chi nhánh làm việc trong công ty
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="branch-name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Tên chi nhánh
              </Label>
              <Input
                id="branch-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugManual) setSlug(toSlug(e.target.value));
                }}
                placeholder="VD: Chi nhánh Hà Nội"
                className="h-10 rounded-lg"
              />
            </div>

            {!isEdit && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="branch-slug"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Slug chi nhánh
                </Label>
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
                  className="h-10 rounded-lg font-mono text-xs"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive font-medium">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg h-10"
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-lg h-10 bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
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
  onEdit,
  onDelete,
}: {
  branch: Workspace;
  workspaceId: number;
  onEdit: (b: Workspace) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="group flex items-center justify-between rounded-lg border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/30 hover:shadow-md transition-all">
      <div className="flex items-center gap-3.5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <GitBranchIcon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            {branch.name}
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            /{branch.slug}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
            branch.isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${branch.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
          />
          {branch.isActive ? "Hoạt động" : "Đã tắt"}
        </span>

        <Link href={`/workspace/${branch.id}/members`}>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 rounded-lg border-border/80 hover:bg-blue-500/10 hover:text-blue-600"
          >
            <UsersIcon className="size-3.5 mr-1" />
            Thành viên
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg">
            <DropdownMenuItem
              onSelect={() => onEdit(branch)}
              className="cursor-pointer gap-2"
            >
              <PencilIcon className="size-3.5 text-amber-500" /> Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(branch.id)}
              className="cursor-pointer gap-2"
            >
              <Trash2Icon className="size-3.5 text-rose-500" /> Xoá chi nhánh
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
      <div className="flex flex-1 flex-col bg-background">
        <PageHeader
          crumbs={[{ label: "Workspace", href: "/admin/workspaces" }]}
          title="..."
        />
        <div className="p-6 md:p-8 space-y-4 max-w-7xl w-full mx-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-muted/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[{ label: "Workspace", href: "/admin/workspaces" }]}
        title={workspace.name}
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Workspace Info Hero Header Card */}
        <div className="rounded-lg border border-border/80 bg-card p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 size-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <BuildingIcon className="size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {workspace.name}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      workspace.isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${workspace.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                    />
                    {workspace.isActive ? "Hoạt động" : "Đã tắt"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  URL: /workspace/{workspace.slug}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/admin/workspaces/${workspaceId}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-10 px-4 border-border/80"
                >
                  <PencilIcon className="size-4 mr-1.5 text-amber-500" /> Chỉnh
                  sửa
                </Button>
              </Link>
              <Link href={`/workspace/${workspaceId}/members`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-10 px-4 border-border/80"
                >
                  <UsersIcon className="size-4 mr-1.5 text-blue-500" /> Thành
                  viên
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Branches list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Danh sách chi nhánh ({workspace.children?.length ?? 0})
            </h2>
            <Button
              size="sm"
              onClick={openCreate}
              className="rounded-lg h-9 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/15"
            >
              <PlusIcon className="size-4 mr-1.5" /> Thêm chi nhánh
            </Button>
          </div>

          {!workspace.children || workspace.children.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border/80 bg-card py-16 text-center shadow-sm">
              <div className="flex size-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 mb-3">
                <GitBranchIcon className="size-6" />
              </div>
              <p className="text-sm font-bold text-foreground">
                Chưa có chi nhánh nào
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tạo chi nhánh đầu tiên để mở rộng mô hình tổ chức
              </p>
              <Button
                size="sm"
                className="mt-4 rounded-lg h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white"
                onClick={openCreate}
              >
                <PlusIcon className="size-4 mr-1.5" /> Thêm chi nhánh ngay
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
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
