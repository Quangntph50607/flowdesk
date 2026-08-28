"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { workspaceService } from "@/services/workspace.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { Workspace } from "@/types";
import {
  SparklesIcon,
  BuildingIcon,
  GitBranchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  SearchIcon,
  PlusIcon,
  ActivityIcon,
  ShieldCheckIcon,
  UserCogIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Workspace card (dùng chung cho cả 2 role) ─────────────────
function WorkspaceCard({
  ws,
  highlightRole,
  isSuperAdmin,
  onSelectBranch,
}: {
  ws: Workspace;
  highlightRole?: string;
  isSuperAdmin: boolean;
  onSelectBranch: (branch: Workspace) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const branches = ws.children ?? [];

  function handleParentClick() {
    if (isSuperAdmin) {
      router.push(`/admin/workspaces/${ws.id}`);
    } else {
      router.push(`/admin-workspace`);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card shadow-sm transition-all duration-300",
        expanded && "border-blue-500/30 shadow-md shadow-blue-500/5",
      )}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-4 p-5 select-none"
        onClick={handleParentClick}
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          <BuildingIcon className="size-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-base text-foreground truncate">
              {ws.name}
            </p>
            {highlightRole && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {highlightRole}
              </span>
            )}
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

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border/60">
            <GitBranchIcon className="size-3.5 text-blue-500" />
            <span className="font-medium">{branches.length} chi nhánh</span>
          </div>
          {branches.length > 0 && (
            <button
              className="flex size-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              aria-label={expanded ? "Thu gọn" : "Xem chi nhánh"}
            >
              {expanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Branch list */}
      {expanded && branches.length > 0 && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
            Chi nhánh
          </p>
          {branches.map((branch) => (
            <button
              key={branch.id}
              className="group flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-sm"
              onClick={() => onSelectBranch(branch)}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
                      branch.isActive ? "bg-emerald-500" : "bg-rose-500",
                    )}
                  />
                  {branch.isActive ? "Active" : "Tắt"}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border/40 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground sm:hidden flex items-center gap-1.5">
          <GitBranchIcon className="size-3 text-blue-500" />
          {branches.length} chi nhánh
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-8 gap-1.5 text-xs text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
          onClick={handleParentClick}
        >
          Xem chi tiết
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");

  const isSuperAdmin = user?.systemRole === "SUPER_ADMIN";
  const isParentAdmin =
    !isSuperAdmin &&
    (user?.workspaces ?? []).some(
      (ws) => ws.roleCode === "ADMIN" && ws.parentId === null,
    );
  const isAgent = !isSuperAdmin && !isParentAdmin;

  // AGENT không cần màn welcome — redirect thẳng về /agent
  useEffect(() => {
    if (user && isAgent) router.replace("/agent");
  }, [user, isAgent, router]);

  // SUPER_ADMIN: fetch toàn bộ workspace từ API
  const { data: allWorkspaces = [], isLoading: loadingAll } = useQuery({
    queryKey: ["admin", "workspaces"],
    queryFn: workspaceService.getAll,
    enabled: isSuperAdmin,
  });

  // Stable IDs — tránh queryKey thay đổi mỗi render
  const adminParentIds = useMemo(
    () =>
      (user?.workspaces ?? [])
        .filter((ws) => ws.roleCode === "ADMIN" && ws.parentId === null)
        .map((ws) => ws.workspaceId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  const { data: adminWorkspaces = [], isLoading: loadingAdmin } = useQuery({
    queryKey: ["workspace", "mine", adminParentIds.join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        // Dùng endpoint /api/workspace/{id} — ADMIN có quyền
        adminParentIds.map((id) => workspaceService.getByIdForMember(id)),
      );
      return results;
    },
    enabled: !isSuperAdmin && adminParentIds.length > 0,
  });

  const isLoading = isSuperAdmin ? loadingAll : loadingAdmin;

  // Roots để hiển thị
  const roots: Workspace[] = isSuperAdmin
    ? allWorkspaces.filter((ws) => ws.parentId === null)
    : adminWorkspaces;

  const filtered = roots.filter(
    (ws) =>
      ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.slug.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelectBranch(branch: Workspace) {
    // SUPER_ADMIN → trang admin
    // ADMIN/AGENT → trang tương ứng
    if (isSuperAdmin) {
      router.push(`/admin/workspaces/${branch.id}`);
    } else {
      router.push(`/admin-workspace/branches/${branch.id}`);
    }
  }

  const totalBranches = roots.reduce(
    (sum, ws) => sum + (ws.children?.length ?? 0),
    0,
  );

  // Role badge cho banner
  const roleLabel = isSuperAdmin ? "Super Admin Portal" : "Admin Portal";
  const RoleIcon = isSuperAdmin ? ShieldCheckIcon : UserCogIcon;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader title="Chào mừng" />

      <div className="flex-1 space-y-8 p-6 md:p-8 max-w-6xl w-full mx-auto">
        {/* ── Hero Banner ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 p-8 md:p-10 text-white shadow-2xl shadow-blue-950/30 border border-blue-500/20">
          <div className="absolute -top-32 -right-32 size-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/30 to-transparent" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-medium text-blue-200 border border-white/10">
                <SparklesIcon className="size-3.5 text-amber-400" />
                Flowdesk — {roleLabel}
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  Chào mừng trở lại,
                </h1>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-blue-300">
                  {user?.fullName ?? "Admin"} 👋
                </h1>
              </div>

              <p className="text-sm text-blue-200/70 max-w-lg leading-relaxed">
                {isSuperAdmin
                  ? "Chọn workspace hoặc chi nhánh để bắt đầu, hoặc truy cập bảng điều khiển hệ thống."
                  : "Chọn workspace của bạn để bắt đầu làm việc."}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                {isSuperAdmin && (
                  <>
                    <Link href="/dashboard">
                      <Button
                        size="sm"
                        className="rounded-lg h-9 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-medium text-xs gap-1.5"
                      >
                        <ActivityIcon className="size-3.5" />
                        Bảng điều khiển
                      </Button>
                    </Link>
                    <Link href="/admin/workspaces/create">
                      <Button
                        size="sm"
                        className="rounded-lg h-9 px-4 bg-blue-500 hover:bg-blue-400 text-white font-medium text-xs gap-1.5 shadow-lg shadow-blue-500/30"
                      >
                        <PlusIcon className="size-3.5" />
                        Tạo Workspace
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats pills */}
            {!isLoading && (
              <div className="flex flex-row md:flex-col gap-3 shrink-0">
                <div className="rounded-xl bg-white/5 backdrop-blur-md px-5 py-4 border border-white/10 text-center min-w-27.5">
                  <p className="text-3xl font-extrabold text-white">
                    {roots.length}
                  </p>
                  <p className="text-[11px] text-blue-300/80 mt-1 font-medium">
                    Workspace
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 backdrop-blur-md px-5 py-4 border border-white/10 text-center min-w-27.5">
                  <p className="text-3xl font-extrabold text-white">
                    {totalBranches}
                  </p>
                  <p className="text-[11px] text-blue-300/80 mt-1 font-medium">
                    Chi nhánh
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Workspace selector ──────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Chọn Workspace
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click vào workspace để xem chi tiết, hoặc mở rộng để chọn chi
                nhánh.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm workspace..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9 rounded-lg border-border/80 bg-card text-sm"
              />
            </div>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RoleIcon className="size-3.5" />
            <span>
              Đăng nhập với quyền{" "}
              <span className="font-semibold text-foreground">{roleLabel}</span>
            </span>
          </div>

          {/* Loading skeleton */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-border/60 bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-card py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 mb-4 border border-blue-500/20">
                <BuildingIcon className="size-7" />
              </div>
              <p className="text-base font-bold text-foreground">
                {search ? "Không tìm thấy workspace" : "Chưa có workspace nào"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {search
                  ? `Không có kết quả cho "${search}"`
                  : isSuperAdmin
                    ? "Tạo workspace đầu tiên để bắt đầu quản lý hệ thống."
                    : "Bạn chưa được gán vào workspace nào."}
              </p>
              {!search && isSuperAdmin && (
                <Link href="/admin/workspaces/create" className="mt-5">
                  <Button
                    size="sm"
                    className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                  >
                    <PlusIcon className="size-3.5 mr-1.5" /> Tạo Workspace ngay
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((ws) => {
                // Tìm role của user trong workspace này (chỉ relevant với non-SUPER_ADMIN)
                const myRole = !isSuperAdmin
                  ? (user?.workspaces ?? []).find(
                      (w) => w.workspaceId === ws.id,
                    )?.roleCode
                  : undefined;

                return (
                  <WorkspaceCard
                    key={ws.id}
                    ws={ws}
                    highlightRole={myRole}
                    isSuperAdmin={isSuperAdmin}
                    onSelectBranch={handleSelectBranch}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
