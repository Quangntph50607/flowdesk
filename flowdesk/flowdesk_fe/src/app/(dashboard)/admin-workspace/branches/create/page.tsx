"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { workspaceService } from "@/services/workspace.service";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GitBranchIcon, GlobeIcon } from "lucide-react";

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function CreateBranchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // parentId từ query string hoặc lấy workspace đầu tiên của admin
  const paramParentId = searchParams.get("parentId");
  const defaultParentId = useMemo(() => {
    if (paramParentId) return Number(paramParentId);
    return (
      (user?.workspaces ?? []).find(
        (ws) => ws.roleCode === "ADMIN" && ws.parentId === null,
      )?.workspaceId ?? 0
    );
  }, [paramParentId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      workspaceService.createBranch(defaultParentId, {
        name: name.trim(),
        slug: slug.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace", "admin-mine"],
      });
      queryClient.invalidateQueries({
        queryKey: ["workspace", "admin-branches"],
      });
      router.push("/admin-workspace/branches");
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
    if (!slug.trim()) {
      setError("Slug không được để trống");
      return;
    }
    if (!defaultParentId) {
      setError("Không tìm thấy workspace cha");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[
          { label: "Dashboard", href: "/admin-workspace" },
          { label: "Chi nhánh", href: "/admin-workspace/branches" },
        ]}
        title="Tạo chi nhánh"
      />

      <div className="flex-1 p-6 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Tạo chi nhánh mới
          </h1>
          <p className="text-xs text-muted-foreground">
            Thêm chi nhánh vào workspace của bạn
          </p>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Tên chi nhánh
              </Label>
              <div className="relative">
                <GitBranchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugManual) setSlug(toSlug(e.target.value));
                  }}
                  placeholder="VD: Chi nhánh Hà Nội"
                  className="pl-10 h-11 rounded-lg border-border/80"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="slug"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Slug (định danh URL)
              </Label>
              <div className="relative">
                <GlobeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    );
                  }}
                  placeholder="chi-nhanh-ha-noi"
                  className="pl-10 h-11 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tự động tạo từ tên. Dùng làm đường dẫn:{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-blue-600 dark:text-blue-400">
                  /{slug || "slug"}
                </code>
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={mutation.isPending}
                className="rounded-lg h-11 px-5"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-lg h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                {mutation.isPending ? "Đang tạo..." : "Tạo chi nhánh"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
