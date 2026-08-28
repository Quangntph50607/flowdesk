"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { workspaceService } from "@/services/workspace.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  LockIcon,
  UnlockIcon,
  Trash2Icon,
  BuildingIcon,
  GitBranchIcon,
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

// ── Member Row ────────────────────────────────────────────────
function MemberRow({
  member,
  workspaceId,
}: {
  member: WorkspaceMember;
  workspaceId: number;
}) {
  const queryClient = useQueryClient();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => workspaceService.toggleMember(workspaceId, member.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ws-members", workspaceId] }),
  });
  const removeMutation = useMutation({
    mutationFn: () => workspaceService.removeMember(workspaceId, member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ws-members", workspaceId] });
      setConfirmRemove(false);
    },
  });

  return (
    <>
      <tr className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
        <td className="py-3.5 px-5">
          <div className="flex items-center gap-3.5">
            <Avatar className="size-9 rounded-full ring-1 ring-border">
              <AvatarImage src={member.avatarUrl ?? ""} />
              <AvatarFallback className="rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600">
                {getInitials(member.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {member.fullName}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
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
        <td className="py-3.5 px-5 text-xs text-muted-foreground">
          {new Date(member.joinedAt).toLocaleDateString("vi-VN")}
        </td>
        <td className="py-3.5 px-5 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground ml-auto">
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-lg">
              <DropdownMenuItem
                onSelect={() => toggleMutation.mutate()}
                className="cursor-pointer gap-2"
              >
                {member.isActive ? (
                  <>
                    <LockIcon className="size-3.5 text-rose-500" /> Khoá tài
                    khoản
                  </>
                ) : (
                  <>
                    <UnlockIcon className="size-3.5 text-emerald-500" /> Mở khoá
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setConfirmRemove(true)}
                className="cursor-pointer gap-2"
              >
                <Trash2Icon className="size-3.5" /> Xoá khỏi workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={() => removeMutation.mutate()}
        isPending={removeMutation.isPending}
        title="Xoá thành viên"
        description={`Xoá ${member.fullName} khỏi workspace?`}
        confirmLabel="Xoá"
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminWorkspaceMembersPage() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  // workspaceId từ query string hoặc lấy mặc định
  const paramWsId = searchParams.get("workspaceId");
  const defaultWsId = useMemo(() => {
    if (paramWsId) return Number(paramWsId);
    return (
      (user?.workspaces ?? []).find(
        (ws) => ws.roleCode === "ADMIN" && ws.parentId === null,
      )?.workspaceId ?? 0
    );
  }, [paramWsId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: workspace } = useQuery({
    queryKey: ["workspace", defaultWsId],
    queryFn: () => workspaceService.getByIdForMember(defaultWsId),
    enabled: !!defaultWsId,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["ws-members", defaultWsId],
    queryFn: () => workspaceService.getMembers(defaultWsId),
    enabled: !!defaultWsId,
  });

  const filtered = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  const wsLevel = workspace?.level ?? 0;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/admin-workspace" }]}
        title="Thành viên"
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {wsLevel === 0 ? (
                <BuildingIcon className="size-4 text-cyan-600" />
              ) : (
                <GitBranchIcon className="size-4 text-blue-600" />
              )}
              <h1 className="text-xl font-bold text-foreground">
                {workspace?.name ?? "Workspace"} — Thành viên
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Đang tải..."
                : `${filtered.length} / ${members.length} thành viên`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
          >
            <UserPlusIcon className="size-3.5" /> Thêm thành viên
          </Button>
        </div>

        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-lg border-border/80 bg-card"
          />
        </div>

        <div className="rounded-lg border border-border/80 overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40">
                  {[
                    "Thành viên",
                    "Vai trò",
                    "Trạng thái",
                    "Ngày tham gia",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3.5 px-5 font-semibold text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="py-4 px-5">
                        <div className="h-9 rounded-lg bg-muted animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <UsersIcon className="size-9 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-medium text-foreground">
                        Chưa có thành viên nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      workspaceId={defaultWsId}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {workspace && (
        <AddMemberDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          workspaceId={defaultWsId}
          workspaceLevel={wsLevel}
          queryKey={["ws-members", defaultWsId]}
          canSearch={user?.systemRole === "SUPER_ADMIN"}
        />
      )}
    </div>
  );
}
