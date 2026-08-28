"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheckIcon,
  MailIcon,
  CalendarIcon,
  UserIcon,
  ImageIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";

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
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[{ label: "Tổng quan", href: "/dashboard" }]}
        title="Tài khoản cá nhân"
      />

      <div className="flex-1 p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6">
        {/* Cover Banner Header Card */}
        <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
          {/* Banner Graphic */}
          <div className="h-36 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl pointer-events-none" />
          </div>

          {/* User Info Content */}
          <div className="p-6 md:p-8 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14 sm:-mt-16">
              <Avatar className="size-24 sm:size-28 rounded-full ring-4 ring-card shadow-xl bg-card">
                <AvatarImage src={avatarUrl || user.avatarUrl || ""} />
                <AvatarFallback className="rounded-full text-2xl font-bold bg-blue-600 text-white">
                  {getInitials(fullName || user.fullName)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 sm:mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {user.fullName}
                  </h1>
                  {user.systemRole === "SUPER_ADMIN" && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                      <ShieldCheckIcon className="size-3.5" /> Super Admin
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MailIcon className="size-3.5 text-blue-500" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-blue-500" />
                    Tham gia{" "}
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Card */}
        <div className="rounded-lg border border-border/80 bg-card p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">
              Chỉnh sửa thông tin cá nhân
            </h2>
            <p className="text-xs text-muted-foreground">
              Cập nhật họ tên hiển thị và liên kết ảnh đại diện
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
            <div className="space-y-1.5">
              <Label
                htmlFor="profile-email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Email
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="profile-email"
                  value={user.email}
                  disabled
                  className="pl-10 h-11 rounded-lg bg-muted/60 text-muted-foreground border-border/60 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Địa chỉ email không thể thay đổi sau khi khởi tạo
              </p>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="profile-fullname"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Họ và tên
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="profile-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-border/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="profile-avatar"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                URL Avatar
              </Label>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="profile-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="pl-10 h-11 rounded-lg border-border/80"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dán đường dẫn ảnh đại diện (URL công khai)
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                <AlertCircleIcon className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                <CheckCircle2Icon className="size-4 shrink-0" />
                <span>Cập nhật thông tin thành công!</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20"
            >
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
