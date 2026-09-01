"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { userService, type UserRecord } from "@/services/user.service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ArrowLeftIcon,
  BuildingIcon,
  GitBranchIcon,
  UsersIcon,
  PlusIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
  SearchIcon,
  CheckIcon,
} from "lucide-react";
import Link from "next/link";
import type { WorkspaceMember } from "@/types";

// ── Schemas ───────────────────────────────────────────────────────
const updateSchema = z.object({
  name: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(150, "Tên tối đa 150 ký tự"),
});
type UpdateSchema = z.infer<typeof updateSchema>;

// ── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  OWNER: { label: "Chủ sở hữu", variant: "default" },
  ADMIN: { label: "Quản trị viên", variant: "secondary" },
  AGENT: { label: "Nhân viên", variant: "outline" },
};

const roleOptions: { value: "OWNER" | "ADMIN" | "AGENT"; label: string }[] = [
  { value: "OWNER", label: "Chủ sở hữu" },
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "AGENT", label: "Nhân viên" },
];

// ── Sheet thêm thành viên ─────────────────────────────────────────
function AddMemberSheet({
  open,
  onOpenChange,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: number;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [roleCode, setRoleCode] = useState<"OWNER" | "ADMIN" | "AGENT">(
    "AGENT",
  );
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setSelectedUser(null);
      setRoleCode("AGENT");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer.current);
  }, [search]);

  const { data: users, isFetching } = useQuery({
    queryKey: ["user-search-admin", debouncedSearch],
    queryFn: () => userService.adminGetAll(debouncedSearch || undefined),
    enabled: debouncedSearch.length >= 1,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      workspaceService.addMember(workspaceId, {
        userId: selectedUser!.id,
        roleCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ws-members", workspaceId],
      });
      onOpenChange(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? "Có lỗi xảy ra");
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Thêm thành viên</SheetTitle>
          <SheetDescription>
            Tìm người dùng theo tên hoặc email rồi chọn vai trò.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 px-4 py-2">
          <div className="space-y-2">
            <Label>Tìm người dùng</Label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nhập tên hoặc email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedUser(null);
                }}
                className="pl-9"
              />
            </div>

            {debouncedSearch.length >= 1 && (
              <div className="rounded-lg border overflow-hidden max-h-60 overflow-y-auto">
                {isFetching ? (
                  <div className="p-3 space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 rounded" />
                    ))}
                  </div>
                ) : !users?.length ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    Không tìm thấy
                  </p>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setSearch(u.fullName);
                        setError("");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(u.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                      {selectedUser?.id === u.id && (
                        <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedUser && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(selectedUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{selectedUser.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
                <CheckIcon className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Vai trò</Label>
            <div className="flex gap-2 flex-wrap">
              {roleOptions.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRoleCode(r.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    roleCode === r.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter className="px-4">
          <Button
            className="w-full"
            onClick={() => addMutation.mutate()}
            disabled={!selectedUser || addMutation.isPending}
          >
            {addMutation.isPending ? "Đang thêm..." : "Thêm thành viên"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Trang chính ───────────────────────────────────────────────────
export default function WorkspaceDetailPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const workspaceId = Number(params.id);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (user === null) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (user.systemRole !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, isAuthenticated, router]);

  // Chi tiết workspace (kèm children)
  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ["admin-ws-detail", workspaceId],
    queryFn: () => workspaceService.adminGetById(workspaceId),
    enabled: user?.systemRole === "SUPER_ADMIN" && !!workspaceId,
  });

  // Members của workspace tổng
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["ws-members", workspaceId],
    queryFn: () => workspaceService.getMembers(workspaceId),
    enabled: user?.systemRole === "SUPER_ADMIN" && !!workspaceId,
  });

  // Form edit tên
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateSchema>({
    resolver: zodResolver(updateSchema),
  });

  useEffect(() => {
    if (workspace) reset({ name: workspace.name });
  }, [workspace, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSchema) =>
      workspaceService.adminUpdate(workspaceId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-ws-detail", workspaceId], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      reset({ name: updated.name });
    },
  });

  const toggleMemberMutation = useMutation({
    mutationFn: (memberId: number) =>
      workspaceService.toggleMemberActive(workspaceId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ws-members", workspaceId] }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) =>
      workspaceService.removeMember(workspaceId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ws-members", workspaceId] }),
  });

  if (!user || user.systemRole !== "SUPER_ADMIN") return null;

  return (
    <>
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dashboard/workspaces" />}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
        </div>

        {wsLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl lg:col-span-2" />
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BuildingIcon className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-2xl font-bold tracking-tight">
                  {workspace?.name}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  /{workspace?.slug}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Owner: {workspace?.ownerName}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* ── Cột trái: Edit tên + Chi nhánh ── */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Thông tin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={handleSubmit((data) =>
                        updateMutation.mutate(data),
                      )}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name">Tên workspace</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name && (
                          <p className="text-sm text-destructive">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      {updateMutation.isError && (
                        <p className="text-sm text-destructive">
                          {(
                            updateMutation.error as {
                              response?: { data?: { message?: string } };
                            }
                          )?.response?.data?.message ?? "Có lỗi xảy ra"}
                        </p>
                      )}
                      {updateMutation.isSuccess && (
                        <p className="text-sm text-green-600">
                          Cập nhật thành công
                        </p>
                      )}
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={!isDirty || updateMutation.isPending}
                      >
                        {updateMutation.isPending
                          ? "Đang lưu..."
                          : "Lưu thay đổi"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Chi nhánh */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitBranchIcon className="h-4 w-4" /> Chi nhánh
                      {workspace?.children?.length ? (
                        <Badge variant="secondary" className="ml-auto">
                          {workspace.children.length}
                        </Badge>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!workspace?.children?.length ? (
                      <p className="text-sm text-muted-foreground px-6 pb-4">
                        Chưa có chi nhánh nào.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {workspace.children.map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center gap-3 px-6 py-3"
                          >
                            <GitBranchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {branch.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                /{branch.slug}
                              </p>
                            </div>
                            <Badge
                              variant={
                                branch.isActive ? "secondary" : "destructive"
                              }
                              className="text-xs shrink-0"
                            >
                              {branch.isActive ? "Hoạt động" : "Đã tắt"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── Cột phải: Thành viên ── */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" /> Thành viên
                    {members?.length ? (
                      <Badge variant="secondary">{members.length}</Badge>
                    ) : null}
                  </h2>
                  <Button size="sm" onClick={() => setSheetOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-1" /> Thêm thành viên
                  </Button>
                </div>

                {membersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : !members?.length ? (
                  <div className="rounded-lg border flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                    <UsersIcon className="h-8 w-8" />
                    <p className="text-sm">Chưa có thành viên nào.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">
                            Thành viên
                          </th>
                          <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                            Email
                          </th>
                          <th className="text-left px-4 py-3 font-medium">
                            Vai trò
                          </th>
                          <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                            Trạng thái
                          </th>
                          <th className="text-right px-4 py-3 font-medium">
                            Thao tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {members.map((m: WorkspaceMember) => {
                          const badge =
                            roleBadge[m.roleCode] ?? roleBadge.AGENT;
                          return (
                            <tr
                              key={m.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(m.fullName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{m.fullName}</p>
                                    <p className="text-xs text-muted-foreground md:hidden">
                                      {m.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                {m.email}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={badge.variant}>
                                  {badge.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <Badge
                                  variant={
                                    m.isActive ? "secondary" : "destructive"
                                  }
                                >
                                  {m.isActive ? "Hoạt động" : "Đã khoá"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {m.roleCode !== "OWNER" && (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleMemberMutation.mutate(m.id)
                                      }
                                      disabled={toggleMemberMutation.isPending}
                                      title={m.isActive ? "Khoá" : "Mở khoá"}
                                    >
                                      {m.isActive ? (
                                        <ToggleRightIcon className="h-4 w-4" />
                                      ) : (
                                        <ToggleLeftIcon className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() =>
                                        removeMemberMutation.mutate(m.id)
                                      }
                                      disabled={removeMemberMutation.isPending}
                                      title="Xoá"
                                    >
                                      <Trash2Icon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <AddMemberSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        workspaceId={workspaceId}
      />
    </>
  );
}
