"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { workspaceService } from "@/services/workspace.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/types";
import {
  BuildingIcon,
  GitBranchIcon,
  UsersIcon,
  PlusIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Branch card nhỏ ───────────────────────────────────────────
function BranchCard({ branch }: { branch: Workspace }) {
  const router = useRouter();
  return (
    <button
      className="group flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-sm"
      onClick={() => router.push(`/admin-workspace/branches/${branch.id}`)}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <GitBranchIcon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
          {branch.name}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          /{branch.slug}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
            branch.isActive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              branch.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500",
            )}
          />
          {branch.isActive ? "Hoạt động" : "Tắt"}
        </span>
        <ArrowRightIcon className="size-4 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

// ── Workspace cha card ────────────────────────────────────────
function WorkspaceSection({ ws }: { ws: Workspace }) {
  const router = useRouter();
  const branches = ws.children ?? [];

  return (
    <div className="space-y-4">
      {/* Header workspace cha */}
      <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          <BuildingIcon className="size-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-foreground truncate">
              {ws.name}
            </h2>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                ws.isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  ws.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500",
                )}
              />
              {ws.isActive ? "Hoạt động" : "Đã tắt"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            /{ws.slug}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-xs gap-1.5 border-border/80"
            onClick={() =>
              router.push(`/admin-workspace/branches/create?parentId=${ws.id}`)
            }
          >
            <PlusIcon className="size-3.5" /> Thêm chi nhánh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-xs gap-1.5 border-border/80"
            onClick={() =>
              router.push(`/admin-workspace/members?workspaceId=${ws.id}`)
            }
          >
            <UsersIcon className="size-3.5" /> Thành viên
          </Button>
        </div>
      </div>

      {/* Danh sách chi nhánh */}
      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-10 text-center">
          <GitBranchIcon className="size-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">
            Chưa có chi nhánh nào
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 h-8 text-xs rounded-lg"
            onClick={() =>
              router.push(`/admin-workspace/branches/create?parentId=${ws.id}`)
            }
          >
            <PlusIcon className="size-3.5 mr-1" /> Tạo chi nhánh đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminWorkspaceDashboard() {
  const user = useAuthStore((s) => s.user);

  const parentIds = useMemo(
    () =>
      (user?.workspaces ?? [])
        .filter((ws) => ws.roleCode === "ADMIN" && ws.parentId === null)
        .map((ws) => ws.workspaceId),
    [user?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspace", "admin-mine", parentIds.join(",")],
    queryFn: () =>
      Promise.all(parentIds.map((id) => workspaceService.getByIdForMember(id))),
    enabled: parentIds.length > 0,
  });

  const totalBranches = workspaces.reduce(
    (s, ws) => s + (ws.children?.length ?? 0),
    0,
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader title="Dashboard" />

      <div className="flex-1 space-y-8 p-6 md:p-8 max-w-5xl w-full mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 p-7 text-white border border-blue-500/20 shadow-xl shadow-blue-950/20">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/30 to-transparent" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-blue-200 border border-white/10">
                <SparklesIcon className="size-3.5 text-amber-400" />
                Admin Portal — Flowdesk
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Xin chào, {user?.fullName ?? "Admin"} 👋
              </h1>
              <p className="text-sm text-blue-200/70 max-w-md">
                Quản lý workspace và chi nhánh của bạn từ đây.
              </p>
            </div>

            {!isLoading && (
              <div className="flex gap-3 shrink-0">
                <div className="rounded-xl bg-white/5 backdrop-blur-md px-5 py-3.5 border border-white/10 text-center">
                  <p className="text-2xl font-extrabold">{workspaces.length}</p>
                  <p className="text-[11px] text-blue-300/80 mt-0.5 font-medium">
                    Workspace
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 backdrop-blur-md px-5 py-3.5 border border-white/10 text-center">
                  <p className="text-2xl font-extrabold">{totalBranches}</p>
                  <p className="text-[11px] text-blue-300/80 mt-0.5 font-medium">
                    Chi nhánh
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/admin-workspace/branches">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg text-xs gap-1.5"
            >
              <GitBranchIcon className="size-3.5" /> Tất cả chi nhánh
            </Button>
          </Link>
          <Link href="/admin-workspace/members">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg text-xs gap-1.5"
            >
              <UsersIcon className="size-3.5" /> Thành viên
            </Button>
          </Link>
        </div>

        {/* Workspace sections */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl border border-border/60 bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-card py-16 text-center">
            <BuildingIcon className="size-10 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground">
              Bạn chưa được gán workspace nào
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Liên hệ Super Admin để được cấp quyền quản lý.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {workspaces.map((ws) => (
              <WorkspaceSection key={ws.id} ws={ws} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
