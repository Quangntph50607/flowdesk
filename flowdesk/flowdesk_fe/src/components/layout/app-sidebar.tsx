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
} from "lucide-react";

// ── Menu SUPER_ADMIN ──────────────────────────────────────────
const navMain = [
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

// ── Brand header ──────────────────────────────────────────────
function SidebarBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link href="/dashboard" />} className="hover:bg-accent/60 transition-colors">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight ml-1 group-data-[collapsible=icon]:hidden">
            <span className="truncate font-bold tracking-tight text-foreground">Flowdesk</span>
            <span className="truncate text-xs font-medium text-blue-600 dark:text-blue-400">
              Super Admin Portal
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="border-r border-border/60 bg-sidebar/95 backdrop-blur-md" {...props}>
      <SidebarHeader>
        <SidebarBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

