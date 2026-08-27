"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheckIcon, MailIcon, CalendarIcon } from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () =>
      userService.updateMe({
        fullName: fullName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      }),
    onSuccess: (updated) => {
      // Cập nhật store
      setUser({
        ...user!,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!fullName.trim()) {
      setError("Họ tên không được để trống");
      return;
    }
    updateMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        crumbs={[{ label: "Tổng quan", href: "/dashboard" }]}
        title="Tài khoản"
      />

      <div className="flex-1 p-6">
        <div className="max-w-xl space-y-6">
          {/* Avatar + info */}
          <div className="flex items-center gap-5 rounded-xl border bg-card p-5">
            <Avatar className="size-16">
              <AvatarImage src={avatarUrl || user.avatarUrl || ""} />
              <AvatarFallback className="text-lg">
                {getInitials(fullName || user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <p className="text-base font-semibold">{user.fullName}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MailIcon className="size-3" />
                {user.email}
              </div>
              {user.systemRole === "SUPER_ADMIN" && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-violet-600">
                  <ShieldCheckIcon className="size-3" />
                  Super Admin
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarIcon className="size-3" />
                Tham gia {new Date(user.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Chỉnh sửa thông tin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={user.email}
                  disabled
                  className="text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Email không thể thay đổi
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-fullname">Họ và tên</Label>
                <Input
                  id="profile-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-avatar">URL Avatar</Label>
                <Input
                  id="profile-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Đường dẫn ảnh đại diện (URL công khai)
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && (
                <p className="text-sm text-emerald-600">Cập nhật thành công!</p>
              )}

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
