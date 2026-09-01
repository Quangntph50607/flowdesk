"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
  UserIcon,
  ShieldIcon,
  MailIcon,
  BuildingIcon,
  Loader2Icon,
} from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth.store";
import { Badge } from "@/components/ui/badge";

function getInitials(name: string) {
  if (!name) return "US";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const logoutMutation = useLogout();
  const { user: authUser } = useAuthStore();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
              }
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setInfoMessage("Tính năng Gói Nâng Cấp Pro đang được phát triển.")}
                  className="cursor-pointer"
                >
                  <SparklesIcon className="h-4 w-4 text-amber-500 mr-2" />
                  Nâng cấp Pro
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setAccountDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <BadgeCheckIcon className="h-4 w-4 text-primary mr-2" />
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setInfoMessage("Tính năng Thanh toán đang được phát triển.")}
                  className="cursor-pointer"
                >
                  <CreditCardIcon className="h-4 w-4 text-muted-foreground mr-2" />
                  Thanh toán
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setInfoMessage("Chưa có thông báo mới.")}
                  className="cursor-pointer"
                >
                  <BellIcon className="h-4 w-4 text-muted-foreground mr-2" />
                  Thông báo
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                {logoutMutation.isPending ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogOutIcon className="h-4 w-4 mr-2" />
                )}
                {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Dialog Thông tin tài khoản */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" /> Thông tin tài khoản
            </DialogTitle>
            <DialogDescription>
              Chi tiết hồ sơ và quyền hạn cá nhân
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
              <Avatar className="h-14 w-14 rounded-full ring-2 ring-primary/20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{user.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MailIcon className="h-3.5 w-3.5" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge variant={authUser?.systemRole === "SUPER_ADMIN" ? "default" : "secondary"} className="text-[11px] gap-1">
                    <ShieldIcon className="h-3 w-3" />
                    {authUser?.systemRole === "SUPER_ADMIN" ? "Super Admin" : "User"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <BuildingIcon className="h-3.5 w-3.5" /> Workspace tham gia
              </h4>
              {!authUser?.workspaces?.length ? (
                <p className="text-xs text-muted-foreground p-3 border rounded-lg bg-muted/20">
                  Chưa trực thuộc workspace nào.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {authUser.workspaces.map((ws) => (
                    <div key={ws.workspaceId} className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                      <div>
                        <p className="font-medium text-foreground">{ws.workspaceName}</p>
                        <p className="text-muted-foreground font-mono text-[11px]">/{ws.workspaceSlug}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {ws.roleCode}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Thông báo ngắn khi bấm tính năng chưa có */}
      <Dialog open={!!infoMessage} onOpenChange={() => setInfoMessage(null)}>
        <DialogContent className="sm:max-w-xs text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Thông báo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{infoMessage}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

