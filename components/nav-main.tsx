"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavMainSubItem = {
  title: string;
  url: string;
};

type NavMainItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavMainSubItem[];
};

type NavMainProps = {
  items: NavMainItem[];
};

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Sale Management</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url || pathname.startsWith(item.url + "/");
          const hasActiveSubItem = item.items?.some(
            (subItem) => pathname === subItem.url,
          );

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isActive || hasActiveSubItem}
            >
              <SidebarMenuItem className="group/collapsible">
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className="transition-all duration-300 ease-in-out hover:bg-sidebar-accent/50 hover:scale-[1.02]"
                      >
                        {item.icon && (
                          <item.icon className="transition-transform duration-300 ease-in-out" />
                        )}
                        <span className="transition-all duration-300 ease-in-out">
                          {item.title}
                        </span>
                        <ChevronRight className="ml-auto transition-transform duration-300 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="transition-all duration-300 ease-in-out overflow-hidden scrollbar-hide">
                      <SidebarMenuSub className="scrollbar-hide">
                        {item.items?.map((subItem) => {
                          const isSubItemActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubItemActive}
                                className="transition-all duration-300 ease-in-out hover:bg-sidebar-accent/50"
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className="transition-all duration-700 ease-in-out hover:bg-sidebar-accent/50 hover:scale-[1.02]"
                  >
                    <Link href={item.url}>
                      {item.icon && (
                        <item.icon className="transition-transform duration-700 ease-in-out" />
                      )}
                      <span className="transition-all duration-700 ease-in-out">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
