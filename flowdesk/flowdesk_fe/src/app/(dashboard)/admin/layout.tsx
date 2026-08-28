import { SuperAdminGuard } from "@/components/layout/super-admin-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminGuard>{children}</SuperAdminGuard>;
}
