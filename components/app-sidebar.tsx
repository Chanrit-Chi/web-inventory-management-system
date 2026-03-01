"use client";

import * as React from "react";
import {
  Banknote,
  BookUser,
  ChartNoAxesCombined,
  FileChartColumnIncreasing,
  FolderKanban,
  LayoutDashboard,
  NotebookText,
  PackageSearch,
  Shield,
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
import Link from "next/link";
import { hasPermission, Permission } from "@/lib/rbac";
import { Role } from "@prisma/client";

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
          permission: "dashboard:admin",
        },
        {
          title: "Manager Dashboard",
          url: "/dashboard/manager",
          permission: "dashboard:manager",
        },
        {
          title: "Sale Dashboard",
          url: "/dashboard/sale",
          permission: "dashboard:sale",
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
          permission: "sale:read",
        },
        {
          title: "New Sale",
          url: "/sales/new-sale",
          permission: "sale:create",
        },
        {
          title: "Invoices",
          url: "/sales/invoice",
          permission: "invoice:read",
        },
        {
          title: "Quotations",
          url: "/sales/quotations",
          permission: "quotation:read",
        },
        {
          title: "POS",
          url: "/sales/pos",
          permission: "pos:read",
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
          permission: "stock:update",
        },
        {
          title: "New Stock",
          url: "/stock/new",
          permission: "stock:create",
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
          permission: "product:read",
        },
        {
          title: "New Product",
          url: "/products/new",
          permission: "product:create",
        },
        {
          title: "Category",
          url: "/products/category/all-categories",
          permission: "category:read",
        },
        {
          title: "Units",
          url: "/products/unit",
          permission: "unit:read",
        },
        {
          title: "Attributes",
          url: "/products/attributes",
          permission: "product:read",
        },
        {
          title: "Barcode",
          url: "/products/barcode",
          permission: "barcode:read",
        },
      ],
    },

    {
      title: "Purchase",
      url: "#",
      icon: WalletCards,
      items: [
        {
          title: "Expenses",
          url: "/expenses",
          permission: "expense:read",
        },
        {
          title: "Purchase Order",
          url: "/purchase/order",
          permission: "purchase_order:read",
        },
        // {
        //   title: "Supplier",
        //   url: "/purchase/supplier",
        //   permission: "supplier:read",
        // },
      ],
    },

    {
      title: "HR Management",
      url: "#",
      icon: BookUser,
      items: [
        {
          title: "Employee",
          url: "/employee",
          permission: "employee:read",
        },
        {
          title: "Supplier",
          url: "/purchase/supplier",
          permission: "supplier:read",
        },
        {
          title: "Customer",
          url: "/customer",
          permission: "customer:read",
        },
      ],
    },
  ],
  navSecondary: [
    // {
    //   title: "Manage Employee",
    //   url: "/employee",
    //   icon: Users,
    //   permission: "user:read",
    // },
    {
      title: "Permissions",
      url: "/settings/permissions",
      icon: Shield,
      permission: "permission:admin",
    },
    {
      title: "Sale Report",
      url: "/sale/report",
      icon: ChartNoAxesCombined,
      permission: "report:read",
    },
    {
      title: "Expense Report",
      url: "/expense/report",
      icon: FileChartColumnIncreasing,
      permission: "report:read",
    },
    {
      title: "Stock Report",
      url: "/stock/report",
      icon: FolderKanban,
      permission: "report:read",
    },
    {
      title: "Product Report",
      url: "/product/report",
      icon: FileChartColumnIncreasing,
      permission: "report:read",
    },
  ],
  // Reports: [
  //   {
  //     name: "Sale Report",
  //     url: "/sale/report",
  //     icon: ChartNoAxesCombined,
  //     permission: "report:read",
  //   },
  //   {
  //     name: "Stock Report",
  //     url: "/stock/report",
  //     icon: FolderKanban,
  //     permission: "report:read",
  //   },
  //   {
  //     name: "Product Report",
  //     url: "/product/report",
  //     icon: FileChartColumnIncreasing,
  //     permission: "report:read",
  //   },
  // ],
};
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: Role } | undefined)?.role as Role;

  const filteredNavMain = data.navMain
    .map((item) => {
      if (!item.items) return item;
      const filteredItems = item.items.filter(
        (subItem) =>
          !subItem.permission ||
          hasPermission(userRole, subItem.permission as Permission),
      );
      return { ...item, items: filteredItems };
    })
    .filter((item) => item.items?.length > 0 || !item.items);

  const filteredNavSecondary = data.navSecondary.filter(
    (item) =>
      !item.permission ||
      hasPermission(userRole, item.permission as Permission),
  );

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
                  <span className="truncate font-medium">CC Inventory</span>
                  <span className="truncate text-xs">Inventory Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        {/* <NavReports reports={filteredReports} /> */}
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
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
