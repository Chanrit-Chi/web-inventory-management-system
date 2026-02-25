"use client";

import { SharedLayout } from "@/components/shared-layout";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { useGetSales } from "@/hooks/useSale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { format, isToday, startOfMonth } from "date-fns";
import {
  ShoppingCart,
  ClipboardList,
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Package,
  Receipt,
} from "lucide-react";
import { OrderWithRelations } from "@/schemas/type-export.schema";

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(val: number | string | null | undefined) {
  return `$${Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const statusStyle: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
};

// ── sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly value: string | number;
  readonly sub?: string;
  readonly color: string;
}) {
  return (
    <div className={`rounded-xl p-5 flex justify-between items-start ${color}`}>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-2xl font-bold text-white">{value}</span>
        {sub && (
          <span className="text-xs text-white/70 bg-white/15 px-2 py-0.5 rounded-full w-max">
            {sub}
          </span>
        )}
      </div>
      <Icon className="h-10 w-10 text-white/40 shrink-0" />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  href,
  color,
}: {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly color: string;
}) {
  return (
    <Link href={href}>
      <div className="group p-4 bg-card rounded-xl border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer h-full">
        <div
          className={`size-9 rounded-lg flex items-center justify-center mb-3 ${color}`}
        >
          <Icon className="size-4" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          </div>
          <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

function RecentSalesTable({
  orders,
}: {
  readonly orders: OrderWithRelations[];
}) {
  if (orders.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
        No recent sales found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Order
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Customer
            </th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Date
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total
            </th>
            <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                #{order.id}
              </td>
              <td className="px-4 py-2.5 font-medium">
                {order.customer?.name ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground text-xs">
                {format(new Date(order.createdAt), "MMM dd, HH:mm")}
              </td>
              <td className="px-4 py-2.5 text-right font-semibold">
                {fmt(order.totalPrice as unknown as number)}
              </td>
              <td className="px-4 py-2.5 text-center">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${statusStyle[order.status] ?? "bg-muted text-muted-foreground"}`}
                >
                  {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────────

export default function SaleDashboardPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const role = (session?.user as { role?: string })?.role ?? "Unknown";

  const { data: salesData, isLoading: salesLoading } = useGetSales(1, 50);
  const orders: OrderWithRelations[] = (salesData?.data ??
    []) as OrderWithRelations[];

  if (sessionPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-8" />
      </div>
    );
  }

  // ── derived metrics ──────────────────────────────────────────────────────
  const todayOrders = orders.filter((o) => isToday(new Date(o.createdAt)));
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + Number(o.totalPrice ?? 0),
    0,
  );
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const monthStart = startOfMonth(new Date());
  const monthRevenue = orders
    .filter((o) => new Date(o.createdAt) >= monthStart)
    .reduce((sum, o) => sum + Number(o.totalPrice ?? 0), 0);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 8);

  return (
    <SharedLayout>
      <div className="w-full px-2 md:px-3 py-3 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Sales Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              {session?.user?.name} · {role}
            </div>
            <Button asChild size="sm">
              <Link href="/sales/new-sale">
                <ShoppingCart className="size-4 mr-1.5" />
                New Sale
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={Receipt}
            label="Today's Revenue"
            value={fmt(todayRevenue)}
            sub={`${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"}`}
            color="bg-[#fe9f43]"
          />
          <MetricCard
            icon={ClipboardList}
            label="Orders Today"
            value={todayOrders.length}
            sub="completed + pending"
            color="bg-[#0e9384]"
          />
          <MetricCard
            icon={Clock}
            label="Pending Orders"
            value={pendingOrders}
            sub={pendingOrders > 0 ? "needs attention" : "all clear"}
            color={pendingOrders > 0 ? "bg-[#e53e3e]" : "bg-[#092c4c]"}
          />
          <MetricCard
            icon={TrendingUp}
            label="Month Revenue"
            value={fmt(monthRevenue)}
            sub={format(new Date(), "MMMM yyyy")}
            color="bg-[#155eef]"
          />
        </div>

        <Separator />

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction
              icon={ShoppingCart}
              label="New Sale"
              description="Create a sales order"
              href="/sales/new-sale"
              color="bg-orange-100 text-orange-600"
            />
            <QuickAction
              icon={ClipboardList}
              label="All Sales"
              description="View & manage orders"
              href="/sales/all-sale"
              color="bg-teal-100 text-teal-600"
            />
            <QuickAction
              icon={Users}
              label="Customers"
              description="Customer directory"
              href="/sales/customers"
              color="bg-blue-100 text-blue-600"
            />
            <QuickAction
              icon={FileText}
              label="Invoices"
              description="Billing & invoices"
              href="/sales/invoice"
              color="bg-purple-100 text-purple-600"
            />
            <QuickAction
              icon={Package}
              label="Quotations"
              description="Draft quotations"
              href="/sales/quotations"
              color="bg-indigo-100 text-indigo-600"
            />
            <QuickAction
              icon={CheckCircle2}
              label="Stock"
              description="Check inventory"
              href="/stock/adjust"
              color="bg-green-100 text-green-600"
            />
          </div>
        </div>

        <Separator />

        {/* Recent Sales */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent Sales
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7">
              <Link href="/sales/all-sale">
                View all <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>

          {salesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-6" />
            </div>
          ) : (
            <RecentSalesTable orders={recentOrders} />
          )}
        </div>
      </div>
    </SharedLayout>
  );
}
