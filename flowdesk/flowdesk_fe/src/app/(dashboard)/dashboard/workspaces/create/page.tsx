"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { userService, type UserRecord } from "@/services/user.service";
import {
  createWorkspaceSchema,
  type CreateWorkspaceSchema,
} from "@/lib/validators/workspace.schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeftIcon, CheckIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CreateWorkspacePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Search owner
  const [ownerSearch, setOwnerSearch] = useState("");
  const [debouncedOwnerSearch, setDebouncedOwnerSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<UserRecord | null>(null);
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
    timer.current = setTimeout(() => setDebouncedOwnerSearch(ownerSearch), 300);
    return () => clearTimeout(timer.current);
  }, [ownerSearch]);

  const { data: ownerResults, isFetching: searchingOwner } = useQuery({
    queryKey: ["user-search", debouncedOwnerSearch],
    queryFn: () => userService.adminGetAll(debouncedOwnerSearch || undefined),
    enabled: debouncedOwnerSearch.length >= 1,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkspaceSchema>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  // Auto-generate slug từ name
  const nameValue = watch("name", "");
  useEffect(() => {
    const slug = nameValue
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setValue("slug", slug, { shouldValidate: false });
  }, [nameValue, setValue]);

  // Sync selectedOwner vào form
  useEffect(() => {
    if (selectedOwner) {
      setValue("ownerEmail", selectedOwner.email, { shouldValidate: true });
    }
  }, [selectedOwner, setValue]);

  const mutation = useMutation({
    mutationFn: (data: CreateWorkspaceSchema) =>
      workspaceService.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      router.push("/dashboard/workspaces");
    },
  });

  if (!user || user.systemRole !== "SUPER_ADMIN") return null;

  return (
    <div className="max-w-lg space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/dashboard/workspaces" />}
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" /> Quay lại
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Tạo workspace mới</CardTitle>
          <CardDescription>
            Workspace là không gian làm việc của một doanh nghiệp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="space-y-4"
          >
            {/* Tên workspace */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên workspace</Label>
              <Input
                id="name"
                placeholder="Spa ABC, Công ty XYZ..."
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">
                  flowdesk.vn/
                </span>
                <Input id="slug" placeholder="spa-abc" {...register("slug")} />
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            {/* Chọn owner */}
            <div className="space-y-2">
              <Label>Chủ workspace (OWNER)</Label>
              <p className="text-xs text-muted-foreground">
                Tìm và chọn người dùng sẽ là chủ workspace. Họ sẽ có toàn quyền
                quản lý.
              </p>

              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={ownerSearch}
                  onChange={(e) => {
                    setOwnerSearch(e.target.value);
                    setSelectedOwner(null);
                  }}
                  className="pl-9"
                />
              </div>

              {/* Kết quả search */}
              {debouncedOwnerSearch.length >= 1 && !selectedOwner && (
                <div className="rounded-lg border overflow-hidden max-h-48 overflow-y-auto">
                  {searchingOwner ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      Đang tìm...
                    </p>
                  ) : !ownerResults?.filter(
                      (u) => u.systemRole !== "SUPER_ADMIN",
                    ).length ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      Không tìm thấy
                    </p>
                  ) : (
                    ownerResults
                      .filter((u) => u.systemRole !== "SUPER_ADMIN")
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedOwner(u);
                            setOwnerSearch(u.fullName);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(u.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {u.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {u.email}
                            </p>
                          </div>
                        </button>
                      ))
                  )}
                </div>
              )}

              {/* Owner đã chọn */}
              {selectedOwner && (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(selectedOwner.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {selectedOwner.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOwner.email}
                    </p>
                  </div>
                  <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSelectedOwner(null);
                      setOwnerSearch("");
                      setValue("ownerEmail", "");
                    }}
                  >
                    Đổi
                  </button>
                </div>
              )}

              {/* Hidden input để react-hook-form validate */}
              <input type="hidden" {...register("ownerEmail")} />
              {errors.ownerEmail && (
                <p className="text-sm text-destructive">
                  {errors.ownerEmail.message}
                </p>
              )}
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive">
                {(
                  mutation.error as {
                    response?: { data?: { message?: string } };
                  }
                )?.response?.data?.message ?? "Có lỗi xảy ra"}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? "Đang tạo..." : "Tạo workspace"}
              </Button>
              <Button
                type="button"
                variant="outline"
                render={<Link href="/dashboard/workspaces" />}
              >
                Huỷ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
