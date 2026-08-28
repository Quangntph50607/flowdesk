"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

/** Chỉ SUPER_ADMIN — chặn mọi role khác về /welcome */
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const ok = user?.systemRole === "SUPER_ADMIN";

  useEffect(() => {
    if (user !== null && !ok) router.replace("/welcome");
  }, [user, ok, router]);

  if (!user || !ok) return null;
  return <>{children}</>;
}

/** ADMIN của workspace cha (parentId = null) — chặn SUPER_ADMIN & AGENT */
export function WorkspaceAdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const isAdmin =
    user?.systemRole !== "SUPER_ADMIN" &&
    (user?.workspaces ?? []).some(
      (ws) => ws.roleCode === "ADMIN" && ws.parentId === null,
    );

  useEffect(() => {
    if (user !== null && !isAdmin) router.replace("/welcome");
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) return null;
  return <>{children}</>;
}

/** AGENT — chỉ user có ít nhất 1 workspace với roleCode AGENT */
export function AgentGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const isAgent =
    user?.systemRole !== "SUPER_ADMIN" &&
    (user?.workspaces ?? []).some((ws) => ws.roleCode === "AGENT");

  useEffect(() => {
    if (user !== null && !isAgent) router.replace("/welcome");
  }, [user, isAgent, router]);

  if (!user || !isAgent) return null;
  return <>{children}</>;
}
