"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
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
import {
  MoreHorizontalIcon,
  ShieldCheckIcon,
  UserIcon,
  PencilIcon,
  UserPlusIcon,
} from "lucide-react";
import type { User } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Create User Dialog ────────────────────────────────────────
function CreateUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      authService.register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
      setEmail("");
      setFullName("");
      setPassword("");
      setError("");
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email không được để trống");
      return;
    }
    if (!fullName.trim()) {
      setError("Họ tên không được để trống");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu ít nhất 6 ký tự");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-fullname">Họ và tên</Label>
              <Input
                id="create-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@flowdesk.vn"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Mật khẩu</Label>
              <Input
                id="create-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit User Dialog ──────────────────────────────────────────
function EditUserDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user.fullName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [error, setError] = useState("");

  const updateMutation = useMutation({
    mutationFn: () =>
      userService.update(user.id, {
        fullName: fullName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) {
      setError("Họ tên không được để trống");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="size-10">
                <AvatarImage src={avatarUrl || user.avatarUrl || ""} />
                <AvatarFallback>
                  {getInitials(fullName || user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-fullname">Họ và tên</Label>
              <Input
                id="edit-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-avatar">URL Avatar</Label>
              <Input
                id="edit-avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── User Row ──────────────────────────────────────────────────
function UserRow({
  user,
  onToggle,
  onEdit,
}: {
  user: User;
  onToggle: (id: number) => void;
  onEdit: (user: User) => void;
}) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/40 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={user.avatarUrl ?? ""} />
            <AvatarFallback className="text-xs">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        {user.systemRole === "SUPER_ADMIN" ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600">
            <ShieldCheckIcon className="size-3" /> Super Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <UserIcon className="size-3" /> User
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            user.isActive
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {user.isActive ? "Hoạt động" : "Bị khoá"}
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
      </td>
      <td className="py-3 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-7" />}
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <PencilIcon className="size-3.5" /> Chỉnh sửa
            </DropdownMenuItem>
            {user.systemRole !== "SUPER_ADMIN" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={user.isActive ? "destructive" : undefined}
                  onClick={() => onToggle(user.id)}
                >
                  {user.isActive ? "Khoá tài khoản" : "Mở khoá tài khoản"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function UsersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: userService.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => userService.toggleActive(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        crumbs={[{ label: "Tổng quan", href: "/dashboard" }]}
        title="Quản lý người dùng"
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Đang tải..." : `${users.length} người dùng`}
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlusIcon className="size-4" />
            Thêm người dùng
          </Button>
        </div>

        <div className="rounded-xl border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Người dùng
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Trạng thái
                </th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">
                  Ngày tạo
                </th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={5} className="py-3 px-4">
                      <div className="h-8 rounded bg-muted animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground text-sm"
                  >
                    Chưa có người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onToggle={(id) => toggleMutation.mutate(id)}
                    onEdit={(u) => setEditingUser(u)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
        />
      )}
    </div>
  );
}
