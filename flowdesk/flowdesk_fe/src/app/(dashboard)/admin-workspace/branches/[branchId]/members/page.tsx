"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { userService, type UserRecord } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  PlusIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
  SearchIcon,
  CheckIcon,
  ArrowLeftIcon,
  GitBranchIcon,
} from "lucide-react";
import Link from "next/link";

const roleBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  OWNER: { label: "Chủ sở hữu", variant: "default" },
  ADMIN: { label: "Quản trị viên", variant: "secondary" },
  AGENT: { label: "Nhân viên", variant: "outline" },
};

// Trong chi nhánh chỉ ADMIN và AGENT
const roleOptions: { value: "ADMIN" | "AGENT"; label: string }[] = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "AGENT", label: "Nhân viên" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Sheet thêm thành viên chi nhánh ──────────────────────────────
function AddMemberSheet({
  open,
  onOpenChange,
  branchId,
  isOwner,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branchId: number;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [roleCode, setRoleCode] = useState<"ADMIN" | "AGENT">("AGENT");
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
    queryKey: ["user-search-branch", debouncedSearch],
    queryFn: () => userService.adminGetAll(debouncedSearch || undefined),
    enabled: debouncedSearch.length >= 1,
  });

  const addMutation = useMutation({
    mutationFn: () =>
      workspaceService.addMember(branchId, {
        userId: selectedUser!.id,
        roleCode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-members", branchId] });
      onOpenChange(false);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? "Có lỗi xảy ra");
    },
  });

  const availableRoles = isOwner
    ? roleOptions
    : roleOptions.filter((r) => r.value === "AGENT");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Thêm thành viên chi nhánh</SheetTitle>
          <SheetDescription>
            Tìm người dùng theo tên hoặc email rồi chọn vai trò trong chi nhánh.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 px-4 py-2">
          {/* Search user */}
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
                  <p className="text-sm font-medium truncate">
                    {selectedUser.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <CheckIcon className="h-4 w-4 text-primary shrink-0" />
              </div>
            )}
          </div>

          {/* Chọn vai trò */}
          <div className="space-y-2">
            <Label>Vai trò trong chi nhánh</Label>
            <div className="flex gap-2">
              {availableRoles.map((r) => (
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
export default function BranchMembersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const branchId = Number(params.branchId);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Workspace tổng mà user quản lý
  const parentWorkspace = user?.workspaces?.find(
    (w) =>
      (w.roleCode === "OWNER" || w.roleCode === "ADMIN") && w.parentId === null,
  );

  useEffect(() => {
    if (user === null) return;
    if (!parentWorkspace) router.replace("/admin-workspace");
  }, [user, parentWorkspace, router]);

  // Lấy thông tin chi nhánh
  const { data: branch } = useQuery({
    queryKey: ["branch-detail", branchId],
    queryFn: () => workspaceService.getForMember(branchId),
    enabled: !!parentWorkspace && !!branchId,
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["branch-members", branchId],
    queryFn: () => workspaceService.getMembers(branchId),
    enabled: !!parentWorkspace && !!branchId,
  });

  const toggleMutation = useMutation({
    mutationFn: (memberId: number) =>
      workspaceService.toggleMemberActive(branchId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["branch-members", branchId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) =>
      workspaceService.removeMember(branchId, memberId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["branch-members", branchId] }),
  });

  if (!user || !parentWorkspace) return null;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/admin-workspace/branches" />}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranchIcon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight">
                {branch?.name ?? "Chi nhánh"}
              </h1>
            </div>
            <p className="text-muted-foreground">
              Quản lý thành viên chi nhánh
              {branch?.slug && (
                <span className="ml-1 text-xs font-mono">/{branch.slug}</span>
              )}
            </p>
          </div>
          <Button onClick={() => setSheetOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" /> Thêm thành viên
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
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
                  <th className="text-left px-4 py-3 font-medium">Vai trò</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                    Trạng thái
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members?.map((m) => {
                  const badge = roleBadge[m.roleCode] ?? roleBadge.AGENT;
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
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge
                          variant={m.isActive ? "secondary" : "destructive"}
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
                              onClick={() => toggleMutation.mutate(m.id)}
                              disabled={toggleMutation.isPending}
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
                              onClick={() => removeMutation.mutate(m.id)}
                              disabled={removeMutation.isPending}
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
                {!members?.length && !isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Chưa có thành viên nào trong chi nhánh này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddMemberSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        branchId={branchId}
        isOwner={parentWorkspace.roleCode === "OWNER"}
      />
    </>
  );
}
