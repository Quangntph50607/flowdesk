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
  SearchIcon,
  LockIcon,
  UnlockIcon,
  MailIcon,
  KeyIcon,
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
      <DialogContent onClose={onClose} className="sm:max-w-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <UserPlusIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Thêm người dùng mới</DialogTitle>
                <p className="text-xs text-muted-foreground">Tạo tài khoản quản trị hoặc nhân viên mới</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="create-fullname" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Họ và tên
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="create-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="pl-10 h-10 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="create-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@flowdesk.vn"
                  className="pl-10 h-10 rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mật khẩu
              </Label>
              <div className="relative">
                <KeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="create-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="pl-10 h-10 rounded-lg"
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="rounded-lg h-10"
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-lg h-10 bg-blue-600 hover:bg-blue-500 text-white font-medium">
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
      <DialogContent onClose={onClose} className="sm:max-w-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <PencilIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Chỉnh sửa người dùng</DialogTitle>
                <p className="text-xs text-muted-foreground">Cập nhật thông tin chi tiết tài khoản</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-lg bg-muted/50 border border-border/60">
              <Avatar className="size-12 rounded-full ring-2 ring-blue-500/20">
                <AvatarImage src={avatarUrl || user.avatarUrl || ""} />
                <AvatarFallback className="rounded-full text-sm font-semibold">
                  {getInitials(fullName || user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-tight text-foreground">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-fullname" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Họ và tên
              </Label>
              <Input
                id="edit-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-avatar" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL Avatar
              </Label>
              <Input
                id="edit-avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="h-10 rounded-lg"
              />
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="rounded-lg h-10"
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="rounded-lg h-10 bg-blue-600 hover:bg-blue-500 text-white font-medium">
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
    <tr className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3.5">
          <Avatar className="size-9 rounded-full ring-1 ring-border">
            <AvatarImage src={user.avatarUrl ?? ""} />
            <AvatarFallback className="rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold leading-none text-foreground">{user.fullName}</p>
            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-5">
        {user.systemRole === "SUPER_ADMIN" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <ShieldCheckIcon className="size-3.5" /> Super Admin
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
            <UserIcon className="size-3.5" /> User
          </span>
        )}
      </td>
      <td className="py-3.5 px-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
            user.isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
          }`}
        >
          <span className={`size-1.5 rounded-full ${user.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
          {user.isActive ? "Hoạt động" : "Bị khoá"}
        </span>
      </td>
      <td className="py-3.5 px-5 text-xs text-muted-foreground font-medium">
        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
      </td>
      <td className="py-3.5 px-5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-auto">
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg">
            <DropdownMenuItem onClick={() => onEdit(user)} className="cursor-pointer gap-2">
              <PencilIcon className="size-3.5 text-blue-500" /> Chỉnh sửa
            </DropdownMenuItem>
            {user.systemRole !== "SUPER_ADMIN" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant={user.isActive ? "destructive" : undefined}
                  onClick={() => onToggle(user.id)}
                  className="cursor-pointer gap-2"
                >
                  {user.isActive ? (
                    <>
                      <LockIcon className="size-3.5 text-rose-500" /> Khoá tài khoản
                    </>
                  ) : (
                    <>
                      <UnlockIcon className="size-3.5 text-emerald-500" /> Mở khoá tài khoản
                    </>
                  )}
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
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: userService.getAll,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => userService.toggleActive(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[{ label: "Tổng quan", href: "/dashboard" }]}
        title="Quản lý người dùng"
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Danh sách tài khoản</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Đang tải dữ liệu..." : `Hiển thị ${filteredUsers.length} trên tổng số ${users.length} người dùng`}
            </p>
          </div>

          <Button size="sm" onClick={() => setCreateOpen(true)} className="rounded-lg h-10 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20">
            <UserPlusIcon className="size-4 mr-1.5" />
            Thêm người dùng
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
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
                    Người dùng
                  </th>
                  <th className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Vai trò
                  </th>
                  <th className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Trạng thái
                  </th>
                  <th className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Ngày khởi tạo
                  </th>
                  <th className="py-3.5 px-5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={5} className="py-4 px-5">
                        <div className="h-9 rounded-lg bg-muted animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-16 text-center text-muted-foreground text-sm"
                    >
                      <UserIcon className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="font-medium text-foreground">Không tìm thấy người dùng nào</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Thử thay đổi từ khoá tìm kiếm hoặc khởi tạo tài khoản mới</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
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

