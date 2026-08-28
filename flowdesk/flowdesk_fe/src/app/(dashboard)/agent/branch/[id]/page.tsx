"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/layout/page-header";
import {
  GitBranchIcon,
  HeadphonesIcon,
  SparklesIcon,
  CheckCircle2Icon,
} from "lucide-react";

export default function AgentBranchPage() {
  const { id } = useParams<{ id: string }>();
  const branchId = Number(id);
  const user = useAuthStore((s) => s.user);

  // Tìm thông tin chi nhánh từ store (không cần API call thêm)
  const myBranch = (user?.workspaces ?? []).find(
    (ws) => ws.workspaceId === branchId,
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[{ label: "Chi nhánh của tôi", href: "/agent" }]}
        title={myBranch?.workspaceName ?? "Chi nhánh"}
      />

      <div className="flex-1 space-y-6 p-6 md:p-8 max-w-4xl w-full mx-auto">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-emerald-950 to-slate-900 p-7 text-white border border-emerald-500/20 shadow-xl">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-emerald-400/30 to-transparent" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-emerald-200 border border-white/10">
                <SparklesIcon className="size-3.5 text-amber-400" />
                Agent Portal — Flowdesk
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {myBranch?.workspaceName ?? "Chi nhánh"}
              </h1>
              <p className="text-sm text-emerald-200/70 font-mono">
                /{myBranch?.workspaceSlug}
              </p>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
              <GitBranchIcon className="size-7 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* Workspace info */}
        <div className="rounded-xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-border/60">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <HeadphonesIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Thông tin chi nhánh
              </p>
              <p className="text-xs text-muted-foreground">
                Chi nhánh bạn đang phụ trách
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tên chi nhánh
              </p>
              <p className="font-semibold text-foreground">
                {myBranch?.workspaceName ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Slug
              </p>
              <p className="font-mono text-blue-600 dark:text-blue-400">
                /{myBranch?.workspaceSlug ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vai trò
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2Icon className="size-3.5" /> Agent
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trạng thái
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Placeholder cho các tính năng agent */}
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center">
          <HeadphonesIcon className="size-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-foreground">Khu vực làm việc</p>
          <p className="text-xs text-muted-foreground mt-1">
            Các tính năng của Agent (ticket, chat, báo cáo...) sẽ hiển thị tại
            đây.
          </p>
        </div>
      </div>
    </div>
  );
}
