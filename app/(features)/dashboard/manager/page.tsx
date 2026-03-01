"use client";

import ManagerOverview from "@/components/manager/manager-overview";
import InventorySummary from "@/components/manager/inventory-summary";
import ChartBarStacked from "@/components/admin/sale-statistic-chart";
import { SharedLayout } from "@/components/shared-layout";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import {
  ShoppingCart,
  Package,
  FileText,
  Receipt,
  Users,
  TruckIcon,
  Layers,
  BarChart3,
} from "lucide-react";

export default function ManagerDashboard() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role || "Unknown";

  if (!session) {
    return <Spinner className="size-8" />;
  }

  const user = session.user;
  return (
    <SharedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome back, {user.name} ({role})
          </div>
        </div>

        {/* Manager Overview Metrics */}
        <ManagerOverview />

        {/* Inventory Summary Section */}
        <InventorySummary />

        {/* Sales Statistics Chart */}
        <ChartBarStacked />

        {/* Quick Actions */}
        <div className="bg-muted/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-5">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "New Sale",
                description: "Create a new sales order",
                icon: ShoppingCart,
                href: "/sales/new-sale",
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
              },
              {
                label: "Products",
                description: "Manage product catalog",
                icon: Package,
                href: "/products",
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-950/40",
              },
              {
                label: "Quotations",
                description: "View and manage quotations",
                icon: FileText,
                href: "/sales/new-quotation",
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-950/40",
              },
              {
                label: "Invoices",
                description: "View and export invoices",
                icon: Receipt,
                href: "/sales/invoice",
                color: "text-orange-600",
                bg: "bg-orange-50 dark:bg-orange-950/40",
              },
              {
                label: "Customers",
                description: "Manage customer records",
                icon: Users,
                href: "/customer",
                color: "text-sky-600",
                bg: "bg-sky-50 dark:bg-sky-950/40",
              },
              {
                label: "Purchase Orders",
                description: "Create and track POs",
                icon: TruckIcon,
                href: "/purchase/new-order",
                color: "text-rose-600",
                bg: "bg-rose-50 dark:bg-rose-950/40",
              },
              {
                label: "Stock Adjustment",
                description: "Adjust inventory levels",
                icon: Layers,
                href: "/stock/adjust",
                color: "text-violet-600",
                bg: "bg-violet-50 dark:bg-violet-950/40",
              },
              {
                label: "Reports",
                description: "View analytics and reports",
                icon: BarChart3,
                href: "/sales/all-sale",
                color: "text-indigo-600",
                bg: "bg-indigo-50 dark:bg-indigo-950/40",
              },
            ].map(({ label, description, icon: Icon, href, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 p-4 bg-background rounded-lg border hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className={`p-2.5 rounded-lg ${bg}`}>
                  <Icon className={`size-5 ${color}`} />
                </div>
                <div>
                  <p className="font-medium group-hover:text-primary transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
