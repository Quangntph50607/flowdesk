"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  crumbs?: Crumb[];
  title?: string;
}

export function PageHeader({ crumbs = [], title }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/85 backdrop-blur-md px-4 sm:px-6 transition-all">
      <SidebarTrigger className="-ml-1 rounded-lg hover:bg-muted/80 transition-colors" />
      <Separator
        orientation="vertical"
        className="mr-2 h-4 self-center bg-border/80"
      />
      <Breadcrumb>
        <BreadcrumbList className="text-xs sm:text-sm font-medium">
          {crumbs.map((crumb, i) => (
            <span
              key={`${crumb.label}-${i}`}
              className="flex items-center gap-1.5"
            >
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="text-muted-foreground">{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {i < crumbs.length - 1 && <BreadcrumbSeparator />}
            </span>
          ))}
          {title && (
            <>
              {crumbs.length > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

