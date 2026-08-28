"use client";

/**
 * Dialog thêm thành viên — dùng chung cho mọi role.
 *
 * Flow:
 *  Tab 1 — Tạo tài khoản mới: nhập email/fullName/password → register → add member
 *  Tab 2 — Tìm theo email:    nhập email → tìm user → add member  (chỉ SUPER_ADMIN)
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { authService } from "@/services/auth.service";
import { apiClient } from "@/lib/api";
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
  UserPlusIcon,
  MailIcon,
  KeyIcon,
  UserIcon,
  SearchIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";
import type { ApiResponse, User } from "@/types";

type TabMode = "create" | "search";

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceId: number;
  /** 0 = workspace cha → ADMIN, 1 = chi nhánh → AGENT */
  workspaceLevel: number;
  /** Query key để invalidate sau khi thêm thành công */
  queryKey: unknown[];
  /** Chỉ SUPER_ADMIN mới thấy tab tìm theo email */
  canSearch?: boolean;
}

export function AddMemberDialog({
  open,
  onClose,
  workspaceId,
  workspaceLevel,
  queryKey,
  canSearch = false,
}: Props) {
  const queryClient = useQueryClient();
  const roleCode = workspaceLevel === 0 ? "ADMIN" : "AGENT";

  const [tab, setTab] = useState<TabMode>("create");

  // ── Tab: Tạo mới ──────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // ── Tab: Tìm theo email ───────────────────────────────────
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function reset() {
    setNewEmail("");
    setNewFullName("");
    setNewPassword("");
    setSearchEmail("");
    setFoundUser(null);
    setSearchError("");
    setError("");
    setSuccess(false);
    setTab("create");
  }

  function handleClose() {
    reset();
    onClose();
  }

  // Tìm user theo email (SUPER_ADMIN)
  async function handleSearch() {
    if (!searchEmail.trim()) {
      setSearchError("Nhập email cần tìm");
      return;
    }
    setSearching(true);
    setSearchError("");
    setFoundUser(null);
    try {
      const { data } = await apiClient.get<ApiResponse<User>>(
        `/api/admin/users/by-email?email=${encodeURIComponent(searchEmail.trim())}`,
      );
      setFoundUser(data.data);
    } catch {
      setSearchError("Không tìm thấy tài khoản với email này");
    } finally {
      setSearching(false);
    }
  }

  // Add member sau khi đã có userId
  const addMutation = useMutation({
    mutationFn: (userId: number) =>
      workspaceService.addMember(workspaceId, { userId, roleCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSuccess(true);
      setTimeout(handleClose, 900);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Không thể thêm vào workspace"),
  });

  // Tạo tài khoản mới rồi add
  const createAndAddMutation = useMutation({
    mutationFn: async () => {
      // 1. Register tài khoản mới
      const user = await authService.register({
        email: newEmail.trim(),
        fullName: newFullName.trim(),
        password: newPassword,
      });
      // 2. Add vào workspace
      await workspaceService.addMember(workspaceId, {
        userId: user.userId,
        roleCode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSuccess(true);
      setTimeout(handleClose, 900);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newEmail.trim()) {
      setError("Email không được để trống");
      return;
    }
    if (!newFullName.trim()) {
      setError("Họ tên không được để trống");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu ít nhất 6 ký tự");
      return;
    }
    createAndAddMutation.mutate();
  }

  const isPending = createAndAddMutation.isPending || addMutation.isPending;

  const roleLabel =
    roleCode === "ADMIN" ? "Admin (Quản trị viên)" : "Agent (Nhân viên)";
  const roleColor =
    roleCode === "ADMIN"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent
        onClose={handleClose}
        className="sm:max-w-md rounded-xl p-6"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserPlusIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Thêm thành viên
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Vai trò được gán tự động theo cấp
              </p>
            </div>
          </div>

          {/* Role badge */}
          <div
            className={`inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-1 text-xs font-semibold border ${roleColor}`}
          >
            {roleCode === "ADMIN" ? (
              <ShieldCheckIcon className="size-3.5" />
            ) : (
              <UserCheckIcon className="size-3.5" />
            )}
            {roleLabel}
          </div>
        </DialogHeader>

        {/* Tabs (chỉ hiện nếu canSearch = true) */}
        {canSearch && (
          <div className="flex gap-1 p-1 rounded-lg bg-muted/60 border border-border/60 mt-2">
            {(["create", "search"] as TabMode[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
                  tab === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "create" ? "Tạo tài khoản mới" : "Tìm theo email"}
              </button>
            ))}
          </div>
        )}

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2Icon className="size-7 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Thêm thành viên thành công!
            </p>
          </div>
        ) : tab === "create" ? (
          /* ── Form tạo mới ── */
          <form onSubmit={handleSubmitCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-fullname"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Họ và tên
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="new-fullname"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="pl-10 h-10 rounded-lg"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="new-email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Email
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@company.vn"
                  className="pl-10 h-10 rounded-lg"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="new-password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Mật khẩu tạm thời
              </Label>
              <div className="relative">
                <KeyIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="pl-10 h-10 rounded-lg"
                  disabled={isPending}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Thành viên có thể đổi mật khẩu sau khi đăng nhập.
              </p>
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
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
                {isPending ? "Đang xử lý..." : "Tạo & thêm vào workspace"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          /* ── Tab tìm theo email (SUPER_ADMIN) ── */
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tìm tài khoản theo email
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="email@example.com"
                    className="pl-10 h-10 rounded-lg"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={searching}
                  className="h-10 px-4 rounded-lg shrink-0"
                >
                  {searching ? "..." : "Tìm"}
                </Button>
              </div>
              {searchError && (
                <p className="text-xs text-destructive">{searchError}</p>
              )}
            </div>

            {foundUser && (
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/80 bg-muted/40">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {foundUser.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {foundUser.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => addMutation.mutate(foundUser.id)}
                  disabled={addMutation.isPending}
                  className="ml-3 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs shrink-0"
                >
                  {addMutation.isPending ? "..." : "Thêm"}
                </Button>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
