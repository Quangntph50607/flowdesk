"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  MoreHorizontalIcon,
  PencilIcon,
  UserPlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersIcon,
  LockIcon,
  UnlockIcon,
  Trash2Icon,
} from "lucide-react";
import type { WorkspaceMember } from "@/types";
import { AddMemberDialog } from "@/components/workspace/add-member-dialog";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Dialog sửa thành viên ─────────────────────────────────────
function EditMemberDialog({
  open,
  onClose,
  member,
  workspaceId,
}: {
  open: boolean;
  onClose: () => void;
  member: WorkspaceMember;
  workspaceId: number;
  workspaceLevel: number;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const toggleMutation = useMutation({
    mutationFn: () => workspaceService.toggleMember(workspaceId, member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const removeMutation = useMutation({
    mutationFn: () => workspaceService.removeMember(workspaceId, member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const isPending = toggleMutation.isPending || removeMutation.isPending;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose} className="sm:max-w-md rounded-lg p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UsersIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Thông tin thành viên
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Quản lý quyền & trạng thái hoạt động
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Member info */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-muted/50 border border-border/60">
            <Avatar className="size-11 rounded-full ring-2 ring-blue-500/20">
              <AvatarImage src={member.avatarUrl ?? ""} />
              <AvatarFallback className="rounded-full text-sm font-semibold">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {member.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 p-3 rounded-lg border border-border/60 bg-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vai trò
              </p>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {member.roleName}
              </p>
            </div>
            <div className="space-y-1 p-3 rounded-lg border border-border/60 bg-card">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Trạng thái
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium mt-1">
                <span
                  className={`size-1.5 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                />
                {member.isActive ? "Hoạt động" : "Bị khoá"}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Ngày tham gia:{" "}
            <span className="font-medium text-foreground">
              {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
            </span>
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 flex-col-reverse sm:flex-row">
          <Button
            type="button"
            variant="destructive"
            onClick={() => removeMutation.mutate()}
            disabled={isPending}
            className="rounded-lg h-10 text-xs"
          >
            <Trash2Icon className="size-3.5 mr-1" /> Xoá khỏi workspace
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toggleMutation.mutate()}
            disabled={isPending}
            className="rounded-lg h-10 text-xs"
          >
            {member.isActive ? (
              <>
                <LockIcon className="size-3.5 mr-1 text-rose-500" /> Khoá tài
                khoản
              </>
            ) : (
              <>
                <UnlockIcon className="size-3.5 mr-1 text-emerald-500" /> Mở
                khoá
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Member Row ────────────────────────────────────────────────
function MemberRow({
  member,
  onEdit,
  onToggle,
  onRemove,
}: {
  member: WorkspaceMember;
  onEdit: (m: WorkspaceMember) => void;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3.5">
          <Avatar className="size-9 rounded-full ring-1 ring-border">
            <AvatarImage src={member.avatarUrl ?? ""} />
            <AvatarFallback className="rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {getInitials(member.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-none text-foreground">
              {member.fullName}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-5">
        {member.roleCode === "ADMIN" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShieldCheckIcon className="size-3.5" /> {member.roleName}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <UserCheckIcon className="size-3.5" /> {member.roleName}
          </span>
        )}
      </td>
      <td className="py-3.5 px-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
            member.isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${member.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
          />
          {member.isActive ? "Hoạt động" : "Bị khoá"}
        </span>
      </td>
      <td className="py-3.5 px-5 text-xs text-muted-foreground font-medium">
        {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
      </td>
      <td className="py-3.5 px-5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-auto">
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg">
            <DropdownMenuItem
              onSelect={() => onEdit(member)}
              className="cursor-pointer gap-2"
            >
              <PencilIcon className="size-3.5 text-blue-500" /> Xem / Sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onToggle(member.id)}
              className="cursor-pointer gap-2"
            >
              {member.isActive ? (
                <>
                  <LockIcon className="size-3.5 text-rose-500" /> Khoá thành
                  viên
                </>
              ) : (
                <>
                  <UnlockIcon className="size-3.5 text-emerald-500" /> Mở khoá
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onRemove(member.id)}
              className="cursor-pointer gap-2"
            >
              <Trash2Icon className="size-3.5 text-rose-500" /> Xoá khỏi
              workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const workspaceId = Number(id);
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(
    null,
  );
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: workspace } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceService.getById(workspaceId),
    enabled: !!workspaceId,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: !!workspaceId,
  });

  const toggleMutation = useMutation({
    mutationFn: (memberId: number) =>
      workspaceService.toggleMember(workspaceId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) =>
      workspaceService.removeMember(workspaceId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      }),
  });

  const workspaceName = workspace?.name ?? "Workspace";

  const crumbs = workspace?.parentId
    ? [
        { label: "Workspace", href: "/admin/workspaces" },
        {
          label: workspaceName,
          href: `/admin/workspaces/${workspace.parentId}`,
        },
      ]
    : [{ label: "Workspace", href: "/admin/workspaces" }];

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader crumbs={crumbs} title="Thành viên" />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Thành viên {workspaceName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Đang tải..."
                : `Hiển thị ${filteredMembers.length} trên tổng số ${members.length} thành viên`}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="rounded-lg h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20"
          >
            <UserPlusIcon className="size-4 mr-1.5" />
            Thêm thành viên
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thành viên theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 rounded-lg border-border/80 bg-card"
          />
        </div>

        {/* Table Container */}
        <div className="rounded-lg border border-border/80 overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  <th className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Thành viên
                  </th>
                  <th className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Vai trò
                  </th>
                  <th className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Ngày tham gia
                  </th>
                  <th className="py-3.5 px-5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={5} className="py-4 px-5">
                        <div className="h-9 rounded-lg bg-muted animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-muted-foreground text-sm"
                    >
                      <UsersIcon className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="font-medium text-foreground">
                        Không tìm thấy thành viên nào
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Thêm thành viên mới vào workspace
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      onEdit={(mem) => setEditingMember(mem)}
                      onToggle={(mid) => toggleMutation.mutate(mid)}
                      onRemove={(mid) => setRemovingId(mid)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog thêm */}
      {workspace && (
        <AddMemberDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          workspaceId={workspaceId}
          workspaceLevel={workspace.level}
          queryKey={["workspace-members", workspaceId]}
          canSearch={true}
        />
      )}

      {/* Dialog sửa */}
      {editingMember && workspace && (
        <EditMemberDialog
          open={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          workspaceId={workspaceId}
          workspaceLevel={workspace.level}
        />
      )}

      {/* Confirm xoá */}
      <ConfirmDialog
        open={!!removingId}
        onClose={() => setRemovingId(null)}
        onConfirm={() => removingId && removeMutation.mutate(removingId)}
        isPending={removeMutation.isPending}
        title="Xoá thành viên"
        description="Thành viên sẽ bị xoá khỏi workspace. Bạn có chắc chắn?"
        confirmLabel="Xoá khỏi workspace"
      />
    </div>
  );
}
