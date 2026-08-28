"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronsUpDownIcon,
  UserIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function NavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-accent/60 transition-colors"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-full border border-blue-500/20 shrink-0">
              <AvatarImage
                src={user.avatarUrl ?? undefined}
                alt={user.fullName}
              />
              <AvatarFallback className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight ml-1 group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-foreground">
                {user.fullName}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-full border border-blue-500/20">
                  <AvatarImage
                    src={user.avatarUrl ?? undefined}
                    alt={user.fullName}
                  />
                  <AvatarFallback className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">
                    {user.fullName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            {user.systemRole === "SUPER_ADMIN" && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-1.5">
                  <ShieldCheckIcon className="size-3.5" /> Super Admin
                </div>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/profile")}
                className="cursor-pointer"
              >
                <UserIcon className="size-4" />
                Tài khoản
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              disabled={isPending}
              onClick={() => logout()}
            >
              <LogOutIcon className="size-4" />
              {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
