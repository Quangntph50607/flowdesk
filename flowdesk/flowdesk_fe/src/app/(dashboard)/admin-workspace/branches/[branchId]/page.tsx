"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "@/services/workspace.service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, GitBranchIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

const updateBranchSchema = z.object({
  name: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(150, "Tên tối đa 150 ký tự"),
});
type UpdateBranchSchema = z.infer<typeof updateBranchSchema>;

export default function BranchDetailPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const branchId = Number(params.branchId);

  const parentWorkspace = user?.workspaces?.find(
    (w) =>
      (w.roleCode === "OWNER" || w.roleCode === "ADMIN") && w.parentId === null,
  );

  useEffect(() => {
    if (user === null) return;
    if (!parentWorkspace) router.replace("/admin-workspace");
  }, [user, parentWorkspace, router]);

  const { data: branch, isLoading } = useQuery({
    queryKey: ["branch-detail", branchId],
    queryFn: () => workspaceService.getForMember(branchId),
    enabled: !!parentWorkspace && !!branchId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateBranchSchema>({
    resolver: zodResolver(updateBranchSchema),
  });

  // Điền giá trị khi branch load xong
  useEffect(() => {
    if (branch) {
      reset({ name: branch.name });
    }
  }, [branch, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBranchSchema) =>
      workspaceService.updateBranch(
        parentWorkspace!.workspaceId,
        branchId,
        data,
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(["branch-detail", branchId], updated);
      queryClient.invalidateQueries({
        queryKey: ["branches", parentWorkspace?.workspaceId],
      });
      reset({ name: updated.name });
    },
  });

  if (!user || !parentWorkspace) return null;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/admin-workspace/branches" />}
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Quay lại
      </Button>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranchIcon className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-bold tracking-tight">
                {branch?.name}
              </h1>
              <Badge variant="outline" className="ml-1 font-mono text-xs">
                /{branch?.slug}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Thuộc workspace <strong>{parentWorkspace.workspaceName}</strong>
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cột trái: form edit */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Thông tin</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSubmit((data) =>
                      updateMutation.mutate(data),
                    )}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Tên chi nhánh</Label>
                      <Input id="name" {...register("name")} />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {updateMutation.isError && (
                      <p className="text-sm text-destructive">
                        {(
                          updateMutation.error as {
                            response?: { data?: { message?: string } };
                          }
                        )?.response?.data?.message ?? "Có lỗi xảy ra"}
                      </p>
                    )}

                    {updateMutation.isSuccess && (
                      <p className="text-sm text-green-600">
                        Cập nhật thành công
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!isDirty || updateMutation.isPending}
                    >
                      {updateMutation.isPending
                        ? "Đang lưu..."
                        : "Lưu thay đổi"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Quick link sang members */}
              <Link
                href={`/admin-workspace/branches/${branchId}/members`}
                className="block"
              >
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <UsersIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Quản lý thành viên</p>
                      <p className="text-xs text-muted-foreground">
                        Thêm, khoá hoặc xoá thành viên
                      </p>
                    </div>
                    <ArrowLeftIcon className="h-4 w-4 text-muted-foreground rotate-180" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
