"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-1 flex-col">
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

      <div className="flex-1 p-6">
        <div className="max-w-lg">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-10 rounded bg-muted animate-pulse" />
              <div className="h-10 rounded bg-muted animate-pulse" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên Workspace</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên workspace"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={workspace?.slug ?? ""}
                  disabled
                  className="text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  Slug không thể thay đổi sau khi tạo
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateMutation.isPending}
                >
                  Huỷ
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
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
