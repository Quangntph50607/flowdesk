"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusIcon, BuildingIcon } from "lucide-react";
import Link from "next/link";

export default function WelcomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  const workspaces = user?.workspaces ?? [];

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Chào mừng, {user?.fullName}</h1>
          <p className="text-muted-foreground mt-1">
            {workspaces.length > 0
              ? "Chọn workspace để bắt đầu"
              : "Bạn chưa có workspace nào. Hãy tạo mới."}
          </p>
        </div>

        {workspaces.length > 0 ? (
          <div className="space-y-3">
            {workspaces.map((ws) => (
              <Card
                key={ws.workspaceId}
                className="cursor-pointer hover:border-primary transition-colors"
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BuildingIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{ws.workspaceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {ws.roleCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Tạo workspace mới</CardTitle>
              <CardDescription>
                Workspace là không gian làm việc của doanh nghiệp bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                render={<Link href="/workspaces/create" />}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Tạo workspace
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
