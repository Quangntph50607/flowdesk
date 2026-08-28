import { WorkspaceAdminGuard } from "@/components/layout/super-admin-guard";

export default function WorkspaceAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceAdminGuard>{children}</WorkspaceAdminGuard>;
}
