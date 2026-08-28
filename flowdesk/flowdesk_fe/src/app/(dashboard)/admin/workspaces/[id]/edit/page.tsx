"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BuildingIcon,
  GlobeIcon,
  AlertCircleIcon,
  PencilIcon,
} from "lucide-react";

export default function EditWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const workspaceId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => workspaceService.getById(workspaceId),
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (workspace) setName(workspace.name);
  }, [workspace]);

  const updateMutation = useMutation({
    mutationFn: () =>
      workspaceService.update(workspaceId, { name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
      router.push(`/admin/workspaces/${workspaceId}`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Tên không được để trống");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[
          { label: "Workspace", href: "/admin/workspaces" },
          {
            label: workspace?.name ?? "...",
            href: `/admin/workspaces/${workspaceId}`,
          },
        ]}
        title="Chỉnh sửa"
      />

      <div className="flex-1 p-6 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Chỉnh sửa Workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Cập nhật thông tin chi tiết cho {workspace?.name}
          </p>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-6 md:p-8 shadow-sm">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 rounded-lg bg-muted/60 animate-pulse" />
              <div className="h-12 rounded-lg bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Tên Workspace
                </Label>
                <div className="relative">
                  <BuildingIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên workspace"
                    className="pl-10 h-11 rounded-lg border-border/80"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Đường dẫn định danh (Slug)
                </Label>
                <div className="relative">
                  <GlobeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={workspace?.slug ?? ""}
                    disabled
                    className="pl-10 h-11 rounded-lg bg-muted/60 text-muted-foreground border-border/60 font-mono text-xs cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Slug cố định và không thể thay đổi sau khi tạo
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                  <AlertCircleIcon className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateMutation.isPending}
                  className="rounded-lg h-11 px-5 border-border/80"
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-lg h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20"
                >
                  <PencilIcon className="size-4 mr-1.5" />
                  {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
