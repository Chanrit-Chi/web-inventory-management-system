"use client";

import { SharedLayout } from "@/components/shared-layout";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

type User = {
  role?: string;
};
export default function SaleDashboardPage() {
  const { data: session, isPending } = useSession();
  const role = (session?.user as User)?.role || "Unknown";

  if (isPending) {
    return <Spinner className="size-8" />;
  }

  return (
    <SharedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sales Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome back, {session?.user?.name} ({role})
          </div>
        </div>

        {/* Sales Metrics */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="bg-muted/50 aspect-video rounded-xl p-6 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-muted-foreground">
              Today&apos;s Sales
            </h3>
            <p className="text-2xl font-bold">$2,450.00</p>
            <p className="text-xs text-green-600">+12% from yesterday</p>
          </div>

          <div className="bg-muted/50 aspect-video rounded-xl p-6 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-muted-foreground">
              Orders Today
            </h3>
            <p className="text-2xl font-bold">15</p>
            <p className="text-xs text-blue-600">3 pending</p>
          </div>

          <div className="bg-muted/50 aspect-video rounded-xl p-6 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-muted-foreground">
              My Performance
            </h3>
            <p className="text-2xl font-bold">98%</p>
            <p className="text-xs text-purple-600">Sales target</p>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="bg-muted/50 min-h-[400px] flex-1 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">New Sale</h4>
              <p className="text-sm text-muted-foreground">
                Create a new sales order
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">View Orders</h4>
              <p className="text-sm text-muted-foreground">
                Manage existing orders
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">Customers</h4>
              <p className="text-sm text-muted-foreground">
                Manage customer data
              </p>
            </div>

            <div className="p-4 bg-background rounded-lg border">
              <h4 className="font-medium">Reports</h4>
              <p className="text-sm text-muted-foreground">
                View sales reports
              </p>
            </div>
          </div>

          <h4 className="font-medium mb-2">Recent Activity</h4>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              No recent activity
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}
