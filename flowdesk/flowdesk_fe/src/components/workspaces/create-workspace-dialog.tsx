"use client";

import { useEffect, useRef, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BuildingIcon,
  SparklesIcon,
  Loader2Icon,
  SearchIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  // Owner search state
  const [ownerSearch, setOwnerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<UserRecord | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceSchema>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "", slug: "", ownerEmail: "" },
  });

  // Reset khi đóng dialog
  useEffect(() => {
    if (!open) {
      reset();
      setOwnerSearch("");
      setDebouncedSearch("");
      setSelectedOwner(null);
    }
  }, [open, reset]);

  // Debounce search
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(ownerSearch), 300);
    return () => clearTimeout(timer.current);
  }, [ownerSearch]);

  // Auto-generate slug
  const nameValue = watch("name", "");
  useEffect(() => {
    if (!nameValue) return;
    const slug = nameValue
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setValue("slug", slug, { shouldValidate: true });
  }, [nameValue, setValue]);

  // Sync selected owner vào form
  useEffect(() => {
    setValue("ownerEmail", selectedOwner?.email ?? "", {
      shouldValidate: !!selectedOwner,
    });
  }, [selectedOwner, setValue]);

  // Search users
  const { data: searchResults, isFetching } = useQuery({
    queryKey: ["user-search", debouncedSearch],
    queryFn: () => userService.adminGetAll(debouncedSearch || undefined),
    enabled: debouncedSearch.length >= 1 && !selectedOwner,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateWorkspaceSchema) =>
      workspaceService.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-workspaces"] });
      onOpenChange(false);
    },
  });

  const nonAdminResults =
    searchResults?.filter((u) => u.systemRole !== "SUPER_ADMIN") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary border border-primary/20">
              <BuildingIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Tạo workspace mới</DialogTitle>
              <DialogDescription className="text-xs">
                Tạo không gian làm việc chính cho doanh nghiệp
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="create-workspace-form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 py-2"
        >
          {/* Tên */}
          <div className="space-y-1.5">
            <Label htmlFor="ws-name" className="text-xs font-semibold">
              Tên workspace <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ws-name"
              placeholder="VD: Spa ABC, Công ty XYZ..."
              className="h-10 rounded-xl"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ws-slug" className="text-xs font-semibold">
                Slug (URL)
              </Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <SparklesIcon className="h-3 w-3 text-cyan-500" /> Tự động tạo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-2.5 rounded-xl border shrink-0">
                flowdesk.vn/
              </span>
              <Input
                id="ws-slug"
                placeholder="spa-abc"
                className="h-10 rounded-xl"
                {...register("slug")}
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Chủ workspace */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Chủ workspace (OWNER) <span className="text-destructive">*</span>
            </Label>

            {selectedOwner ? (
              /* Hiển thị owner đã chọn */
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(selectedOwner.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedOwner.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedOwner.email}
                  </p>
                </div>
                <CheckIcon className="h-4 w-4 text-primary shrink-0" />
                <button
                  type="button"
                  title="Đổi"
                  onClick={() => {
                    setSelectedOwner(null);
                    setOwnerSearch("");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* Search box */
              <div className="space-y-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên hoặc email..."
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    className="h-10 rounded-xl pl-9"
                  />
                </div>
                {debouncedSearch.length >= 1 && (
                  <div className="rounded-xl border overflow-hidden max-h-44 overflow-y-auto bg-popover">
                    {isFetching ? (
                      <p className="p-3 text-xs text-muted-foreground text-center">
                        Đang tìm...
                      </p>
                    ) : !nonAdminResults.length ? (
                      <p className="p-3 text-xs text-muted-foreground text-center">
                        Không tìm thấy
                      </p>
                    ) : (
                      nonAdminResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedOwner(u)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left border-b last:border-0"
                        >
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-[10px]">
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
              </div>
            )}

            {/* hidden input để RHF validate */}
            <input type="hidden" {...register("ownerEmail")} />
            {errors.ownerEmail && (
              <p className="text-xs text-destructive">
                {errors.ownerEmail.message}
              </p>
            )}
          </div>

          {mutation.isError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {(
                mutation.error as { response?: { data?: { message?: string } } }
              )?.response?.data?.message ?? "Có lỗi xảy ra khi tạo workspace"}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            form="create-workspace-form"
            disabled={mutation.isPending}
            className="rounded-xl min-w-[120px]"
          >
            {mutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo workspace"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
