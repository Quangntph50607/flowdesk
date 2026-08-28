"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  GitBranchIcon,
  ArrowRightIcon,
  SparklesIcon,
  HeadphonesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceInfo } from "@/types";

function BranchCard({ ws }: { ws: WorkspaceInfo }) {
  const router = useRouter();
  return (
    <button
      className="group flex w-full items-center gap-4 rounded-xl border border-border/80 bg-card p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md"
      onClick={() => router.push(`/agent/branch/${ws.workspaceId}`)}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-transform group-hover:scale-105">
        <GitBranchIcon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
          {ws.workspaceName}
        </p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
          /{ws.workspaceSlug}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Agent
        </span>
        <ArrowRightIcon className="size-4 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

export default function AgentDashboard() {
  const user = useAuthStore((s) => s.user);

  // Chỉ lấy các chi nhánh user được phân bổ với role AGENT
  const myBranches = (user?.workspaces ?? []).filter(
    (ws) => ws.roleCode === "AGENT",
  );

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader title="Chi nhánh của tôi" />

      <div className="flex-1 space-y-8 p-6 md:p-8 max-w-3xl w-full mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 p-7 text-white border border-blue-500/20 shadow-xl">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-blue-400/30 to-transparent" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-3.5 py-1 text-xs font-medium text-blue-200 border border-white/10">
                <SparklesIcon className="size-3.5 text-amber-400" />
                Agent Portal — Flowdesk
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Xin chào, {user?.fullName ?? "Agent"} 👋
              </h1>
              <p className="text-sm text-blue-200/70">
                Chọn chi nhánh bên dưới để bắt đầu làm việc.
              </p>
            </div>

            <div className="rounded-xl bg-white/5 backdrop-blur-md px-4 py-3.5 border border-white/10 text-center shrink-0">
              <p className="text-2xl font-extrabold">{myBranches.length}</p>
              <p className="text-[11px] text-blue-300/80 mt-0.5 font-medium">
                Chi nhánh
              </p>
            </div>
          </div>
        </div>

        {/* Branch list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Chi nhánh được phân bổ
          </h2>

          {myBranches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-card py-14 text-center">
              <HeadphonesIcon className="size-10 text-muted-foreground/30 mb-3" />
              <p className="font-semibold text-foreground">
                Bạn chưa được phân bổ vào chi nhánh nào
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Liên hệ Admin workspace để được cấp quyền.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myBranches.map((ws) => (
                <BranchCard key={ws.workspaceId} ws={ws} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
