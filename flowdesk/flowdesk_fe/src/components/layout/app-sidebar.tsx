"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutDashboardIcon,
  UsersIcon,
  BuildingIcon,
  GitBranchIcon,
  UserCogIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";
import { useAuthStore } from "@/store/auth.store";

function getSuperAdminNav() {
  return [
    {
      title: "Tổng quan",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Người dùng",
      url: "/dashboard/users",
      icon: UsersIcon,
    },
    {
      title: "Workspace",
      url: "/dashboard/workspaces",
      icon: BuildingIcon,
    },
  ];
}

function getOwnerAdminNav() {
  return [
    {
      title: "Tổng quan",
      url: "/admin-workspace",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Chi nhánh",
      url: "/admin-workspace/branches",
      icon: GitBranchIcon,
    },
    {
      title: "Thành viên",
      url: "/admin-workspace/members",
      icon: UserCogIcon,
    },
  ];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  const isSuperAdmin = user?.systemRole === "SUPER_ADMIN";
  const ownerAdminWorkspace = user?.workspaces?.find(
    (w) =>
      (w.roleCode === "OWNER" || w.roleCode === "ADMIN") && w.parentId === null,
  );
  const agentBranches =
    user?.workspaces
      ?.filter((w) => w.roleCode === "AGENT")
      ?.map((w) => ({
        id: w.workspaceId,
        name: w.workspaceName,
        slug: w.workspaceSlug,
      })) ?? [];

  const homeUrl = isSuperAdmin
    ? "/dashboard"
    : ownerAdminWorkspace
      ? "/admin-workspace"
      : agentBranches.length > 0
        ? `/agent/branch/${agentBranches[0].id}`
        : "/welcome";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href={homeUrl} />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                F
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">FlowDesk</span>
                <span className="text-xs text-muted-foreground">
                  {isSuperAdmin
                    ? "Super Admin"
                    : ownerAdminWorkspace
                      ? ownerAdminWorkspace.workspaceName
                      : "Agent"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* SUPER_ADMIN nav */}
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản trị hệ thống</SidebarGroupLabel>
            <SidebarMenu>
              {getSuperAdminNav().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* OWNER/ADMIN nav */}
        {!isSuperAdmin && ownerAdminWorkspace && (
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarMenu>
              {getOwnerAdminNav().map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* AGENT nav */}
        {!isSuperAdmin && !ownerAdminWorkspace && agentBranches.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Chi nhánh của tôi</SidebarGroupLabel>
            <SidebarMenu>
              {agentBranches.map((branch) => (
                <SidebarMenuItem key={branch.id}>
                  <SidebarMenuButton
                    render={<Link href={`/agent/branch/${branch.id}`} />}
                  >
                    <GitBranchIcon />
                    <span>{branch.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName ?? "Unknown",
            email: user?.email ?? "",
            avatar: user?.avatarUrl ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
