"use client";

import { SharedLayout } from "@/components/shared-layout";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { useCountUp } from "@/hooks/useCountUp";
import { useGetSales } from "@/hooks/useSale";
import { StatusBadge } from "@/components/StatusBadge";
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
  Wallet,
} from "lucide-react";
import { OrderWithRelations } from "@/schemas/type-export.schema";
import { usePartialPaymentStats } from "@/components/dashboards/dashboard-cards";

function fmt(val: number | string | null | undefined) {
  return `$${Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}


function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
  countTarget,
}: {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly value: string | number;
  readonly sub?: string;
  readonly color: string;
  readonly delay?: number;
  readonly countTarget?: number;
}) {
  const animated = useCountUp(countTarget ?? 0);
  const displayValue = countTarget === undefined ? value : animated;
  return (
    <div
      className={`animate-dash-enter relative overflow-hidden rounded-xl p-5 flex flex-col justify-between items-start min-h-30 ${color}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col gap-1 z-10 w-full">
        <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-2xl font-bold text-white leading-tight">
          {displayValue}
        </span>
      </div>
      <div className="z-10 w-full mt-auto">
        {sub && (
          <span className="text-[10px] sm:text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full w-max flex items-center gap-1.5 backdrop-blur-sm">
            {sub}
          </span>
        )}
      </div>
      <Icon className="absolute -right-4 -top-4 h-24 w-24 text-white/15 shrink-0 rotate-12" />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  href,
  color,
  delay = 0,
}: {
  readonly icon: React.ElementType;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly color: string;
  readonly delay?: number;
}) {
  return (
    <Link href={href}>
      <div
        className="animate-dash-enter group p-4 bg-card rounded-xl border h-full"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div
          className={`size-10 rounded-xl flex items-center justify-center mb-4 shadow-sm border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${color}`}
        >
          <Icon className="size-5" />
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
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Paid
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Balance
            </th>
            <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-accent transition-colors">
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
              <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                {fmt(Number(order.invoice?.amountPaid ?? 0))}
              </td>
              <td
                className={`px-4 py-2.5 text-right font-medium ${Number(order.totalPrice ?? 0) -
                  Number(order.invoice?.amountPaid ?? 0) >
                  0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
                  }`}
              >
                {fmt(
                  Math.max(
                    0,
                    Number(order.totalPrice ?? 0) -
                    Number(order.invoice?.amountPaid ?? 0),
                  ),
                )}
              </td>
              <td className="px-4 py-2.5 text-center">
                <StatusBadge status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  const todayOrders = orders.filter((o) => isToday(new Date(o.createdAt)));
  const todayCompletedOrders = todayOrders.filter(
    (o) => o.status === "COMPLETED",
  ).length;
  const todayPendingOrders = todayOrders.filter(
    (o) => o.status === "PENDING",
  ).length;
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + Number(o.totalPrice ?? 0),
    0,
  );
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const monthStart = startOfMonth(new Date());
  const monthRevenue = orders
    .filter((o) => new Date(o.createdAt) >= monthStart)
    .reduce((sum, o) => sum + Number(o.totalPrice ?? 0), 0);

  const { partialOrders, totalBalanceDue } = usePartialPaymentStats(orders);

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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            icon={Receipt}
            label="Today's Revenue"
            value={fmt(todayRevenue)}
            sub={`${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"}`}
            color="bg-[#fe9f43]"
            delay={0}
          />
          <MetricCard
            icon={ClipboardList}
            label="Orders Today"
            value={todayOrders.length}
            sub={`Completed ${todayCompletedOrders} + Pending ${todayPendingOrders}`}
            color="bg-[#0e9384]"
            delay={80}
            countTarget={todayOrders.length}
          />
          <MetricCard
            icon={Clock}
            label="Pending Orders"
            value={pendingOrders}
            sub={pendingOrders > 0 ? "needs attention" : "all clear"}
            color={pendingOrders > 0 ? "bg-[#e53e3e]" : "bg-[#092c4c]"}
            delay={160}
            countTarget={pendingOrders}
          />
          <MetricCard
            icon={TrendingUp}
            label="Month Revenue"
            value={fmt(monthRevenue)}
            sub={format(new Date(), "MMMM yyyy")}
            color="bg-[#155eef]"
            delay={240}
          />
          <MetricCard
            icon={Wallet}
            label="Partial Payments"
            value={partialOrders.length}
            sub={`${fmt(totalBalanceDue)} due`}
            color="bg-[#7c3aed]"
            delay={320}
            countTarget={partialOrders.length}
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
              color="bg-orange-500/10 text-orange-600 border-orange-500/20"
              delay={0}
            />
            <QuickAction
              icon={ClipboardList}
              label="All Sales"
              description="View & manage orders"
              href="/sales/all-sale"
              color="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              delay={60}
            />
            <QuickAction
              icon={Users}
              label="Customers"
              description="Customer directory"
              href="/customer"
              color="bg-blue-500/10 text-blue-600 border-blue-500/20"
              delay={120}
            />
            <QuickAction
              icon={FileText}
              label="Invoices"
              description="Billing & invoices"
              href="/sales/invoice"
              color="bg-purple-500/10 text-purple-600 border-purple-500/20"
              delay={180}
            />
            <QuickAction
              icon={Package}
              label="Quotations"
              description="Draft quotations"
              href="/sales/quotations"
              color="bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
              delay={240}
            />
            <QuickAction
              icon={CheckCircle2}
              label="Stock"
              description="Check inventory"
              href="/stock/adjust"
              color="bg-rose-500/10 text-rose-600 border-rose-500/20"
              delay={300}
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
