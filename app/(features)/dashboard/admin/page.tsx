"use client";

import DashboardOverview from "@/components/admin/dashboard-overview";
import ProductInfo from "@/components/admin/product-info";
import ChartBarStacked from "@/components/admin/sale-statistic-chart";
import { SharedLayout } from "@/components/shared-layout";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import {
  Users,
  Package,
  ShoppingCart,
  Layers,
  FileText,
  Receipt,
} from "lucide-react";

export default function DashboardPage() {
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome back, {user.name} ({role})
          </div>
        </div>

        {/* Admin Overview Metrics */}
        <DashboardOverview />

        {/* Product Information Section */}
        <ProductInfo />

        <ChartBarStacked />

        {/* Quick Actions */}
        <div className="bg-muted/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-5">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: "User Management",
                description: "Manage users and roles",
                icon: Users,
                href: "/employee",
                color: "text-blue-600",
                bg: "bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/15 dark:border-blue-500/25",
              },
              {
                label: "Product Catalog",
                description: "Browse and manage products",
                icon: Package,
                href: "/products/product-list",
                color: "text-emerald-600",
                bg: "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/15 dark:border-emerald-500/25",
              },
              {
                label: "All Sales",
                description: "View and manage all orders",
                icon: ShoppingCart,
                href: "/sales/all-sale",
                color: "text-orange-600",
                bg: "bg-orange-500/10 border-orange-500/20 dark:bg-orange-500/15 dark:border-orange-500/25",
              },
              {
                label: "Stock",
                description: "Adjust and track inventory",
                icon: Layers,
                href: "/stock/adjust",
                color: "text-purple-600",
                bg: "bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/15 dark:border-purple-500/25",
              },
              {
                label: "Quotations",
                description: "Review customer quotations",
                icon: FileText,
                href: "/sales/quotations",
                color: "text-sky-600",
                bg: "bg-sky-500/10 border-sky-500/20 dark:bg-sky-500/15 dark:border-sky-500/25",
              },
              {
                label: "Invoices",
                description: "View and export invoices",
                icon: Receipt,
                href: "/sales/invoice",
                color: "text-rose-600",
                bg: "bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/15 dark:border-rose-500/25",
              },
            ].map(
              ({ label, description, icon: Icon, href, color, bg }, idx) => (
                <Link
                  key={href}
                  href={href}
                  className="animate-dash-enter flex items-center gap-4 p-4 bg-card rounded-lg border group"
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center border shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${bg}`}
                  >
                    <Icon className={`size-5 ${color}`} />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
