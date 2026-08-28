"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  GitBranchIcon,
  UsersIcon,
  UserPlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  LockIcon,
  UnlockIcon,
  Trash2Icon,
  UserCheckIcon,
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
  const [removingOpen, setRemovingOpen] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () => workspaceService.toggleMember(workspaceId, member.id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["branch-members", workspaceId],
      }),
  });

  const removeMutation = useMutation({
    mutationFn: () => workspaceService.removeMember(workspaceId, member.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["branch-members", workspaceId],
      });
      setRemovingOpen(false);
    },
  });

  return (
    <>
      <tr className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors">
        <td className="py-3.5 px-5">
          <div className="flex items-center gap-3.5">
            <Avatar className="size-9 rounded-full ring-1 ring-border">
              <AvatarImage src={member.avatarUrl ?? ""} />
              <AvatarFallback className="rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <UserCheckIcon className="size-3.5" /> {member.roleName}
          </span>
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
                    <LockIcon className="size-3.5 text-rose-500" /> Khoá
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
                onSelect={() => setRemovingOpen(true)}
                className="cursor-pointer gap-2"
              >
                <Trash2Icon className="size-3.5" /> Xoá khỏi chi nhánh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      <ConfirmDialog
        open={removingOpen}
        onClose={() => setRemovingOpen(false)}
        onConfirm={() => removeMutation.mutate()}
        isPending={removeMutation.isPending}
        title="Xoá khỏi chi nhánh"
        description={`Xoá ${member.fullName} khỏi chi nhánh này?`}
        confirmLabel="Xoá"
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const branchId = Number(id);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: branch } = useQuery({
    queryKey: ["workspace", branchId],
    queryFn: () => workspaceService.getByIdForMember(branchId),
    enabled: !!branchId,
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["branch-members", branchId],
    queryFn: () => workspaceService.getMembers(branchId),
    enabled: !!branchId,
  });

  const filtered = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/admin-workspace" },
          { label: "Chi nhánh", href: "/admin-workspace/branches" },
        ]}
        title={branch?.name ?? "..."}
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <GitBranchIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {branch?.name ?? "Chi nhánh"}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                /{branch?.slug}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setAddOpen(true)}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
          >
            <UserPlusIcon className="size-3.5" /> Thêm Agent
          </Button>
        </div>

        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm thành viên..."
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
                  Array.from({ length: 3 }).map((_, i) => (
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
                        Chưa có Agent nào
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Thêm Agent để bắt đầu
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <MemberRow key={m.id} member={m} workspaceId={branchId} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddMemberDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        workspaceId={branchId}
        workspaceLevel={1}
        queryKey={["branch-members", branchId]}
      />
    </div>
  );
}
