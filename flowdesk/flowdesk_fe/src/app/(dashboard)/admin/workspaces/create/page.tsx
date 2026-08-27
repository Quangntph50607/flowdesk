"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { workspaceService } from "@/services/workspace.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-1 flex-col">
      <PageHeader
        crumbs={[
          { label: "Tổng quan", href: "/dashboard" },
          { label: "Workspace", href: "/admin/workspaces" },
        ]}
        title="Tạo Workspace mới"
      />

      <div className="flex-1 p-6">
        <div className="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tên */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Tên Workspace</Label>
              <Input
                id="name"
                placeholder="VD: TechCorp Vietnam"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="VD: techcorp-vn"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Chỉ dùng chữ thường, số và dấu gạch ngang. URL:{" "}
                <code className="bg-muted px-1 rounded text-xs">
                  /{slug || "..."}
                </code>
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createMutation.isPending}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang tạo..." : "Tạo Workspace"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
