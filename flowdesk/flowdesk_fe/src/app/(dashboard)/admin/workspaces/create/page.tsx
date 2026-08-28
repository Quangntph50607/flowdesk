"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BuildingIcon,
  GlobeIcon,
  AlertCircleIcon,
  PlusIcon,
} from "lucide-react";

// Tự động tạo slug từ tên
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

export default function CreateWorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      workspaceService.create({ name: name.trim(), slug: slug.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
      router.push("/admin/workspaces");
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err?.response?.data?.message ?? "Đã có lỗi xảy ra");
    },
  });

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManual) setSlug(toSlug(val));
  };

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Tên workspace không được để trống");
      return;
    }
    if (!slug.trim()) {
      setError("Slug không được để trống");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PageHeader
        crumbs={[
          { label: "Tổng quan", href: "/dashboard" },
          { label: "Workspace", href: "/admin/workspaces" },
        ]}
        title="Tạo Workspace mới"
      />

      <div className="flex-1 p-6 md:p-8 max-w-2xl w-full mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Khởi tạo Workspace mới
          </h1>
          <p className="text-xs text-muted-foreground">
            Tạo không gian làm việc chính cho công ty hoặc tổ chức
          </p>
        </div>

        <div className="rounded-lg border border-border/80 bg-card p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tên */}
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
                  placeholder="VD: TechCorp Vietnam"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-border/80"
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label
                htmlFor="ws-slug"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Slug (Mã định danh URL)
              </Label>
              <Input
                id="ws-slug"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                placeholder="techcorp"
                className="h-11 rounded-lg font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Tự động tạo từ tên workspace nếu để trống. Sử dụng làm đường dẫn
                URL:{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-blue-600 dark:text-blue-400">
                  /{slug || "slug-workspace"}
                </code>
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
                className="rounded-lg h-11 px-5 border-border/80"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg h-11 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20"
              >
                {createMutation.isPending
                  ? "Đang tạo..."
                  : "Khởi tạo Workspace"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
