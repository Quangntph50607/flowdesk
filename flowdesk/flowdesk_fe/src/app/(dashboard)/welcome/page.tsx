"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, BuildingIcon, ArrowRightIcon } from "lucide-react";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";

export default function WelcomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user === null) return;
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [user, isAuthenticated, router]);

  const workspaces = user?.workspaces ?? [];

  const handleSelectWorkspace = (ws: {
    workspaceId: number;
    roleCode: string;
    parentId?: number | null;
  }) => {
    if (user?.systemRole === "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }
    if (ws.roleCode === "OWNER" || ws.roleCode === "ADMIN") {
      router.push("/admin-workspace");
    } else if (ws.roleCode === "AGENT") {
      router.push(`/agent/branch/${ws.workspaceId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleCreateWorkspace = () => {
    if (user?.systemRole === "SUPER_ADMIN") {
      router.push("/dashboard/workspaces/create");
    } else {
      setCreateDialogOpen(true);
    }
  };

  return (
    <>
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Chào mừng, {user?.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {workspaces.length > 0
                ? "Chọn workspace để bắt đầu làm việc"
                : "Bạn chưa có workspace nào. Hãy tạo mới để bắt đầu."}
            </p>
          </div>

          {workspaces.length > 0 ? (
            <div className="space-y-3">
              {workspaces.map((ws) => (
                <Card
                  key={ws.workspaceId}
                  onClick={() => handleSelectWorkspace(ws)}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all rounded-2xl group border-border/80"
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                      <BuildingIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{ws.workspaceName}</p>
                      <p className="text-xs text-muted-foreground">
                        Vai trò: <span className="font-medium text-foreground">{ws.roleCode}</span>
                      </p>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </CardContent>
                </Card>
              ))}

              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-dashed h-11"
                  onClick={handleCreateWorkspace}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Tạo thêm workspace mới
                </Button>
              </div>
            </div>
          ) : (
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <BuildingIcon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Tạo workspace mới</CardTitle>
                <CardDescription className="text-xs">
                  Workspace là không gian quản lý và làm việc riêng cho doanh nghiệp của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:opacity-95 text-white shadow-md shadow-primary/20 h-11"
                  onClick={handleCreateWorkspace}
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Tạo workspace ngay
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}

