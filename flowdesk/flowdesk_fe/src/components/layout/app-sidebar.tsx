"use client";

import * as React from "react";
import Link from "next/link";
import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  UsersIcon,
  BuildingIcon,
  ShieldCheckIcon,
  UserCogIcon,
  GitBranchIcon,
  HeadphonesIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

// ── Menus theo role ───────────────────────────────────────────
const superAdminNav = [
  {
    title: "Tổng quan",
    url: "/dashboard",
    icon: <LayoutDashboardIcon className="size-4" />,
  },
  {
    title: "Người dùng",
    url: "/admin/users",
    icon: <UsersIcon className="size-4" />,
  },
  {
    title: "Workspace",
    url: "/admin/workspaces",
    icon: <BuildingIcon className="size-4" />,
  },
];

const workspaceAdminNav = [
  {
    title: "Dashboard",
    url: "/admin-workspace",
    icon: <LayoutDashboardIcon className="size-4" />,
  },
  {
    title: "Chi nhánh",
    url: "/admin-workspace/branches",
    icon: <GitBranchIcon className="size-4" />,
  },
  {
    title: "Thành viên",
    url: "/admin-workspace/members",
    icon: <UsersIcon className="size-4" />,
  },
];

const agentNav = [
  {
    title: "Chi nhánh của tôi",
    url: "/agent",
    icon: <GitBranchIcon className="size-4" />,
  },
];

// ── Xác định role hiện tại ────────────────────────────────────
type PortalRole = "super_admin" | "workspace_admin" | "agent";

function getPortalRole(
  user: ReturnType<typeof useAuthStore.getState>["user"],
): PortalRole {
  if (!user) return "agent";
  if (user.systemRole === "SUPER_ADMIN") return "super_admin";
  const isParentAdmin = user.workspaces.some(
    (ws) => ws.roleCode === "ADMIN" && ws.parentId === null,
  );
  if (isParentAdmin) return "workspace_admin";
  return "agent";
}

const portalMeta: Record<
  PortalRole,
  { label: string; Icon: React.ElementType }
> = {
  super_admin: { label: "Super Admin Portal", Icon: ShieldCheckIcon },
  workspace_admin: { label: "Admin Portal", Icon: UserCogIcon },
  agent: { label: "Agent Portal", Icon: HeadphonesIcon },
};

// ── Brand header ──────────────────────────────────────────────
function SidebarBrand({ role }: { role: PortalRole }) {
  const { label, Icon } = portalMeta[role];
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          render={<Link href="/welcome" />}
          className="hover:bg-accent/60 transition-colors"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Icon className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight ml-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate font-bold tracking-tight text-foreground">
              Flowdesk
            </span>
            <span className="truncate text-xs font-medium text-blue-600 dark:text-blue-400">
              {label}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((s) => s.user);
  const role = getPortalRole(user);

  const navItems =
    role === "super_admin"
      ? superAdminNav
      : role === "workspace_admin"
        ? workspaceAdminNav
        : agentNav;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/60 bg-sidebar/95 backdrop-blur-md"
      {...props}
    >
      <SidebarHeader>
        <SidebarBrand role={role} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
