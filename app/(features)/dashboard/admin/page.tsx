"use client";

import DashboardOverview from "@/components/admin/dashboard-overview";
import ProductInfo from "@/components/admin/product-info";
import ChartBarStacked from "@/components/admin/sale-statistic-chart";
import { SharedLayout } from "@/components/shared-layout";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role || "Unknown";

  if (!session) {
    return <Spinner className="size-8" />; // Or handle loading state
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

        {/* Admin Controls & System Overview */}
        <div className="bg-muted/50 min-h-125 flex-1 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">System Administration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">User Management</h4>
              <p className="text-sm text-muted-foreground">
                Manage users and roles
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">Product Catalog</h4>
              <p className="text-sm text-muted-foreground">
                Manage products and inventory
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">Sales Reports</h4>
              <p className="text-sm text-muted-foreground">
                View detailed analytics
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">System Settings</h4>
              <p className="text-sm text-muted-foreground">
                Configure system preferences
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">Backup & Security</h4>
              <p className="text-sm text-muted-foreground">
                System maintenance
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">Audit Logs</h4>
              <p className="text-sm text-muted-foreground">
                View system activity
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Recent System Activity</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• User john.doe logged in - 2 minutes ago</div>
              <div>• New product added: Widget Pro - 15 minutes ago</div>
              <div>• Sale order #ORD-001 completed - 23 minutes ago</div>
              <div>• Database backup completed - 1 hour ago</div>
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
