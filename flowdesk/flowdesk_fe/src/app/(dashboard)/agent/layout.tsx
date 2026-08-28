import { AgentGuard } from "@/components/layout/super-admin-guard";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AgentGuard>{children}</AgentGuard>;
}
