"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranchIcon } from "lucide-react";
import Link from "next/link";

export default function AgentPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user === null) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const branches =
      user.workspaces?.filter((w) => w.roleCode === "AGENT") ?? [];
    if (branches.length === 1) {
      router.replace(`/agent/branch/${branches[0].workspaceId}`);
    }
  }, [user, isAuthenticated, router]);

  const branches =
    user?.workspaces?.filter((w) => w.roleCode === "AGENT") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chi nhánh của tôi</h1>
        <p className="text-muted-foreground">Chọn chi nhánh để làm việc</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((ws) => (
          <Link key={ws.workspaceId} href={`/agent/branch/${ws.workspaceId}`}>
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <GitBranchIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{ws.workspaceName}</p>
                  <p className="text-xs text-muted-foreground">
                    /{ws.workspaceSlug}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
