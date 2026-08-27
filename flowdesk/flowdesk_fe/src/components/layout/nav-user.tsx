"use client";

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
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function NavUser() {
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
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={user.avatarUrl ?? ""} alt={user.fullName} />
              <AvatarFallback className="rounded-lg text-xs">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.fullName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* User info */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatarUrl ?? ""} alt={user.fullName} />
                  <AvatarFallback className="rounded-lg text-xs">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* Role badge */}
            {user.systemRole === "SUPER_ADMIN" && (
              <>
                <DropdownMenuSeparator />
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
                  <ShieldCheckIcon className="size-3" />
                  <span>Super Admin</span>
                </div>
              </>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem render={<a href="/profile" />}>
                <UserIcon className="size-4" />
                Tài khoản
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              disabled={isPending}
              onSelect={() => logout()}
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
