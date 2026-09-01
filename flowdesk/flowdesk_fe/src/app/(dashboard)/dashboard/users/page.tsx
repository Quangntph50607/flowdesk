"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SearchIcon,
  ShieldIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  PlusIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { CreateUserDialog } from "@/components/users/create-user-dialog";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (user === null) return;
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (user.systemRole !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, isAuthenticated, router]);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer.current);
  }, [search]);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: () => userService.adminGetAll(debouncedSearch || undefined),
    enabled: user?.systemRole === "SUPER_ADMIN",
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => userService.adminToggleActive(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  if (!user || user.systemRole !== "SUPER_ADMIN") return null;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Quản lý Người dùng
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quản lý và cấp quyền tất cả tài khoản toàn hệ thống
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:opacity-95 text-white shadow-md shadow-primary/20 shrink-0"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Tạo người dùng
          </Button>
        </div>

        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-card border-border/80 focus-visible:ring-primary"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/80 overflow-hidden bg-card/80 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Người dùng</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Email</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Vai trò</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users?.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-full ring-2 ring-primary/10">
                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                              {getInitials(u.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground">{u.fullName}</p>
                            <p className="text-xs text-muted-foreground md:hidden mt-0.5">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-medium hidden md:table-cell">
                        {u.email}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        {u.systemRole === "SUPER_ADMIN" ? (
                          <Badge className="gap-1 rounded-lg bg-gradient-to-r from-primary to-cyan-600 text-white font-medium">
                            <ShieldIcon className="h-3 w-3" /> Super Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-lg border-border text-muted-foreground font-normal">
                            User
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isActive ? (
                          <Badge variant="secondary" className="gap-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <UserCheckIcon className="h-3 w-3" /> Hoạt động
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <UserXIcon className="h-3 w-3" /> Đã khoá
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {u.systemRole !== "SUPER_ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMutation.mutate(u.id)}
                            disabled={toggleMutation.isPending}
                            className="rounded-xl h-8 text-xs gap-1 hover:bg-muted"
                          >
                            {u.isActive ? (
                              <>
                                <ToggleRightIcon className="h-4 w-4 text-rose-500" /> Khoá
                              </>
                            ) : (
                              <>
                                <ToggleLeftIcon className="h-4 w-4 text-emerald-500" /> Mở khoá
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!isLoading && !users?.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-16 text-center text-muted-foreground text-sm"
                      >
                        Không tìm thấy người dùng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
