"use client";

import * as React from "react";
import {
  Banknote,
  ChartNoAxesCombined,
  FileChartColumnIncreasing,
  FolderKanban,
  LayoutDashboard,
  NotebookText,
  PackageSearch,
  Users,
  WalletCards,
  Warehouse,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { useSession } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavSecondary } from "./nav-secondary";
import { NavReports } from "./nav-reports";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboard,
      items: [
        {
          title: "Admin Dashboard",
          url: "/dashboard/admin",
        },
        {
          title: "Sale Dashboard",
          url: "/dashboard/sale",
        },
      ],
    },
    {
      title: "Sale",
      url: "#",
      icon: Banknote,
      items: [
        {
          title: "All Sale",
          url: "/sales/all-sale",
        },
        {
          title: "New Sale",
          url: "/sales/new-sale",
        },
        {
          title: "Invoices",
          url: "/sales/invoice",
        },
        {
          title: "Quotations",
          url: "/sales/quotations",
        },
        {
          title: "POS",
          url: "/sales/pos",
        },
      ],
    },

    {
      title: "Stock",
      url: "#",
      icon: Warehouse,
      items: [
        {
          title: "Adjust Stock",
          url: "/stock/adjust",
        },
        {
          title: "New Stock",
          url: "/stock/new",
        },
      ],
    },
    {
      title: "Product",
      url: "#",
      icon: PackageSearch,
      items: [
        {
          title: "View All Products",
          url: "/products/product-list",
        },
        {
          title: "New Product",
          url: "/products/new",
        },
        {
          title: "Category",
          url: "/products/category/all-categories",
        },

        {
          title: "Product Variant",
          url: "/products/variant",
        },
        {
          title: "Barcode",
          url: "/products/barcode",
        },
      ],
    },

    {
      title: "Purchase",
      url: "#",
      icon: WalletCards,
      items: [
        {
          title: "Purchase Order",
          url: "/purchase/order",
        },
        {
          title: "Supplier",
          url: "/purchase/supplier",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Manage Employee",
      url: "/employee",
      icon: Users,
    },
  ],
  Reports: [
    {
      name: "Sale Report",
      url: "/sale/report",
      icon: ChartNoAxesCombined,
    },
    {
      name: "Stock Report",
      url: "/stock/report",
      icon: FolderKanban,
    },
    {
      name: "Product Report",
      url: "/product/report",
      icon: FileChartColumnIncreasing,
    },
  ],
};
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg ">
                  <NotebookText className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">KC Shop</span>
                  <span className="truncate text-xs">Inventory Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavReports reports={data.Reports} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {session?.user && (
          <NavUser
            user={{
              name: session.user.name,
              email: session.user.email,
              avatar: session.user.image ?? "",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
