"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { workspaceService } from "@/services/workspace.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  GitBranchIcon,
  PlusIcon,
  UsersIcon,
  ArrowRightIcon,
  BuildingIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types";
import Link from "next/link";

function BranchCard({
  branch,
  parentName,
}: {
  branch: Workspace;
  parentName: string;
}) {
  const router = useRouter();
  return (
    <div className="group rounded-xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          onClick={() => router.push(`/admin-workspace/branches/${branch.id}`)}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <GitBranchIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
              {branch.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              /{branch.slug}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
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
      </div>

      <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
        <BuildingIcon className="size-3" /> {parentName}
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs rounded-lg"
          onClick={() => router.push(`/admin-workspace/branches/${branch.id}`)}
        >
          <ArrowRightIcon className="size-3.5 mr-1" /> Chi tiết
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs rounded-lg"
          onClick={() =>
            router.push(`/admin-workspace/members?workspaceId=${branch.id}`)
          }
        >
          <UsersIcon className="size-3.5 mr-1" /> Thành viên
        </Button>
      </div>
    </div>
  );
}

export default function AdminBranchesPage() {
  const user = useAuthStore((s) => s.user);

  const parentIds = useMemo(
    () =>
      (user?.workspaces ?? [])
        .filter((ws) => ws.roleCode === "ADMIN" && ws.parentId === null)
        .map((ws) => ws.workspaceId),
    [user?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspace", "admin-branches", parentIds.join(",")],
    queryFn: () =>
      Promise.all(parentIds.map((id) => workspaceService.getByIdForMember(id))),
    enabled: parentIds.length > 0,
  });

  // Flatten tất cả branches từ các workspace cha
  const allBranches = workspaces.flatMap((ws) =>
    (ws.children ?? []).map((b) => ({ branch: b, parentName: ws.name })),
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/admin-workspace" }]}
        title="Chi nhánh"
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Danh sách chi nhánh
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLoading ? "Đang tải..." : `${allBranches.length} chi nhánh`}
            </p>
          </div>
          <Link href="/admin-workspace/branches/create">
            <Button
              size="sm"
              className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
            >
              <PlusIcon className="size-3.5" /> Thêm chi nhánh
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-xl border border-border/60 bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : allBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-card py-16 text-center">
            <GitBranchIcon className="size-10 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground">
              Chưa có chi nhánh nào
            </p>
            <Link href="/admin-workspace/branches/create" className="mt-4">
              <Button
                size="sm"
                className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs"
              >
                <PlusIcon className="size-3.5 mr-1" /> Tạo chi nhánh đầu tiên
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allBranches.map(({ branch, parentName }) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                parentName={parentName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
