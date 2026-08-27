"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { userService } from "@/services/user.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { MoreHorizontalIcon, PencilIcon, UserPlusIcon } from "lucide-react";
import type { WorkspaceMember } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Dialog thêm thành viên ────────────────────────────────────
function AddMemberDialog({
  open,
  onClose,
  workspaceId,
  workspaceLevel,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: number;
  workspaceLevel: number;
}) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [roleCode, setRoleCode] = useState<"ADMIN" | "AGENT">(
    workspaceLevel === 0 ? "ADMIN" : "AGENT",
  );
  const [error, setError] = useState("");

  const availableRoles = workspaceLevel === 0 ? ["ADMIN"] : ["AGENT"];

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: userService.getAll,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      workspaceService.addMember(workspaceId, {
        userId: Number(userId),
        roleCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspaceId],
      });
      onClose();
      setUserId("");
      setError("");
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId) {
      setError("Vui lòng chọn người dùng");
      return;
    }
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm thành viên</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-select">Người dùng</Label>
              <select
                id="user-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Chọn người dùng --</option>
                {users
                  .filter((u) => !u.systemRole)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <div className="flex gap-2">
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleCode(r as "ADMIN" | "AGENT")}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      roleCode === r
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {r === "ADMIN" ? "Admin" : "Agent"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {workspaceLevel === 0
                  ? "Workspace cấp công ty chỉ nhận ADMIN"
                  : "Chi nhánh chỉ nhận AGENT"}
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addMutation.isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Đang thêm..." : "Thêm thành viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Dialog sửa thành viên ─────────────────────────────────────
function EditMemberDialog({
  open,
  onClose,
  member,
  workspaceId,
  workspaceLevel,
}: {
  open: boolean;
  onClose: () => void;
  member: WorkspaceMember;
  workspaceId: number;
  workspaceLevel: number;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  // Remove + re-add với role mới (BE không có PATCH role, cách đơn giản nhất)
  // Thực ra BE chỉ có toggle-active, nên ta chỉ cho sửa trạng thái active ở đây
  // và hiển thị thông tin member

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
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Thông tin thành viên</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="size-10">
              <AvatarImage src={member.avatarUrl ?? ""} />
              <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{member.fullName}</p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Role</p>
              <Badge
                variant={member.roleCode === "ADMIN" ? "default" : "secondary"}
              >
                {member.roleName}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Trạng thái</p>
              <Badge variant={member.isActive ? "success" : "destructive"}>
                {member.isActive ? "Hoạt động" : "Bị khoá"}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ngày tham gia</p>
            <p className="text-sm">
              {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={() => removeMutation.mutate()}
            disabled={isPending}
          >
            Xoá khỏi workspace
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => toggleMutation.mutate()}
            disabled={isPending}
          >
            {member.isActive ? "Khoá thành viên" : "Mở khoá thành viên"}
          </Button>
          <Button type="button" onClick={onClose} disabled={isPending}>
            Đóng
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
    <tr className="border-b last:border-0 hover:bg-muted/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={member.avatarUrl ?? ""} />
            <AvatarFallback className="text-xs">
              {getInitials(member.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">
              {member.fullName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {member.email}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <Badge variant={member.roleCode === "ADMIN" ? "default" : "secondary"}>
          {member.roleName}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <Badge variant={member.isActive ? "success" : "destructive"}>
          {member.isActive ? "Hoạt động" : "Bị khoá"}
        </Badge>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
      </td>
      <td className="py-3 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-7" />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(member)}>
              <PencilIcon className="size-3.5" /> Xem / Sửa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onToggle(member.id)}>
              {member.isActive ? "Khoá thành viên" : "Mở khoá thành viên"}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onRemove(member.id)}
            >
              Xoá khỏi workspace
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
  const parentHref = workspace?.parentId
    ? `/admin/workspaces/${workspace.parentId}`
    : "/admin/workspaces";

  // Breadcrumb: Workspace > [Tên workspace cha nếu là chi nhánh] > Thành viên
  const crumbs = workspace?.parentId
    ? [
        { label: "Workspace", href: "/admin/workspaces" },
        {
          label: workspaceName,
          href: `/admin/workspaces/${workspace.parentId}`,
        },
      ]
    : [{ label: "Workspace", href: "/admin/workspaces" }];

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader crumbs={crumbs} title="Thành viên" />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `${members.length} thành viên`}
          </p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlusIcon className="size-4" />
            Thêm thành viên
          </Button>
        </div>

        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Thành viên
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Ngày tham gia
                </th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={5} className="py-3 px-4">
                      <div className="h-8 rounded bg-muted animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    Chưa có thành viên nào
                  </td>
                </tr>
              ) : (
                members.map((m) => (
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

      {/* Dialog thêm */}
      {workspace && (
        <AddMemberDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          workspaceId={workspaceId}
          workspaceLevel={workspace.level}
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
        confirmLabel="Xoá"
      />
    </div>
  );
}
