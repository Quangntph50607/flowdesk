"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import {
  registerSchema,
  type RegisterSchema,
} from "@/lib/validators/auth.schema";
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
import { UserPlusIcon, Loader2Icon } from "lucide-react";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (data: RegisterSchema) => authService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
              <UserPlusIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Tạo người dùng mới</DialogTitle>
              <DialogDescription className="text-xs">
                Tạo tài khoản truy cập hệ thống FlowDesk
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          id="create-user-dialog-form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 py-2"
        >
          <div className="space-y-2">
            <Label htmlFor="user-fullName" className="text-xs font-semibold">
              Họ và tên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-fullName"
              placeholder="VD: Nguyễn Văn A"
              className="h-10 rounded-xl bg-muted/30 focus-visible:ring-primary"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email" className="text-xs font-semibold">
              Địa chỉ Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              placeholder="example@domain.com"
              className="h-10 rounded-xl bg-muted/30 focus-visible:ring-primary"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password" className="text-xs font-semibold">
              Mật khẩu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user-password"
              type="password"
              placeholder="Ít nhất 6 ký tự"
              className="h-10 rounded-xl bg-muted/30 focus-visible:ring-primary"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {mutation.isError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
              {(
                mutation.error as {
                  response?: { data?: { message?: string } };
                }
              )?.response?.data?.message ?? "Có lỗi xảy ra khi tạo người dùng"}
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
            form="create-user-dialog-form"
            disabled={mutation.isPending}
            className="rounded-xl bg-gradient-to-r from-primary to-cyan-600 hover:opacity-95 text-white shadow-md shadow-primary/25 min-w-[120px]"
          >
            {mutation.isPending ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo tài khoản"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
