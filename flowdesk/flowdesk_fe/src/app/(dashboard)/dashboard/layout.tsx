import { SuperAdminGuard } from "@/components/layout/super-admin-guard";

export default function DashboardPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminGuard>{children}</SuperAdminGuard>;
}
