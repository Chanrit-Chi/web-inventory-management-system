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
                href: "/users/management",
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-950/40",
              },
              {
                label: "Product Catalog",
                description: "Browse and manage products",
                icon: Package,
                href: "/products",
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950/40",
              },
              {
                label: "All Sales",
                description: "View and manage all orders",
                icon: ShoppingCart,
                href: "/sales/all-sale",
                color: "text-orange-600",
                bg: "bg-orange-50 dark:bg-orange-950/40",
              },
              {
                label: "Stock",
                description: "Adjust and track inventory",
                icon: Layers,
                href: "/stock/adjust",
                color: "text-purple-600",
                bg: "bg-purple-50 dark:bg-purple-950/40",
              },
              {
                label: "Quotations",
                description: "Review customer quotations",
                icon: FileText,
                href: "/sales/quotations",
                color: "text-sky-600",
                bg: "bg-sky-50 dark:bg-sky-950/40",
              },
              {
                label: "Invoices",
                description: "View and export invoices",
                icon: Receipt,
                href: "/sales/invoice",
                color: "text-rose-600",
                bg: "bg-rose-50 dark:bg-rose-950/40",
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
