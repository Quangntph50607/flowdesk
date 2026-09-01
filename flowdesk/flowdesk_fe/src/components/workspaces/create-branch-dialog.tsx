"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
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
import { GitBranchIcon, SparklesIcon, Loader2Icon } from "lucide-react";

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  workspaceName?: string;
}

export function CreateBranchDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
}: CreateBranchDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceSchema>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Auto-generate slug from name
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

  const mutation = useMutation({
    mutationFn: (data: CreateWorkspaceSchema) =>
      workspaceService.createBranch(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches", workspaceId] });
      onOpenChange(false);
      reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-primary border border-primary/20">
              <GitBranchIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Tạo chi nhánh mới</DialogTitle>
              <DialogDescription className="text-xs">
                {workspaceName
                  ? `Thuộc workspace ${workspaceName}`
                  : "Thêm chi nhánh cho không gian làm việc"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="create-branch-dialog-form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="branch-name" className="text-xs font-semibold">
              Tên chi nhánh <span className="text-destructive">*</span>
            </Label>
            <Input
              id="branch-name"
              placeholder="VD: Chi nhánh Quận 1, Hà Nội..."
              className="h-10 rounded-xl bg-muted/30 focus-visible:ring-primary"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="branch-slug" className="text-xs font-semibold">
                Slug chi nhánh
              </Label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <SparklesIcon className="h-3 w-3 text-cyan-500" /> Tự động tạo
              </span>
            </div>
            <Input
              id="branch-slug"
              placeholder="quan-1"
              className="h-10 rounded-xl bg-muted/30 focus-visible:ring-primary"
              {...register("slug")}
            />
            {errors.slug && (
              <p className="text-xs text-destructive mt-1">
                {errors.slug.message}
              </p>
            )}
          </div>

          {mutation.isError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
              {(
                mutation.error as {
                  response?: { data?: { message?: string } };
                }
              )?.response?.data?.message ?? "Có lỗi xảy ra khi tạo chi nhánh"}
            </div>
          )}
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-border hover:bg-muted"
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            form="create-branch-dialog-form"
            disabled={mutation.isPending}
            className="rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:opacity-95 text-white shadow-md shadow-primary/25 min-w-[120px]"
          >
            {mutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo chi nhánh"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
