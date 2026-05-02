"use client";

import {
  BaggageClaim,
  CheckCircle2,
  Clock,
  Package,
  Receipt,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { Separator } from "../../ui/separator";
import { isToday, startOfMonth } from "date-fns";
import { useGetSales } from "@/hooks/useSale";
import { useGetProducts } from "@/hooks/useProduct";
import { OrderWithRelations } from "@/schemas/type-export.schema";
import { Spinner } from "@/components/ui/spinner";
import {
  DashboardHeroCard,
  DashboardCompactCard,
  PartialPaymentHeroCard,
  PartialPaymentCompactCard,
  usePartialPaymentStats,
  fmtCurrency,
} from "../dashboard-cards";


export default function ManagerOverview() {
  const { data: salesData, isLoading: salesLoading } = useGetSales(1, 100);
  const { data: productsData } = useGetProducts(1, 1);

  const orders = (salesData?.data ?? []) as OrderWithRelations[];
  const totalProductCount = productsData?.pagination?.total ?? 0;

  const monthStart = startOfMonth(new Date());
  const monthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart);
  const monthRevenue = monthOrders.reduce(
    (sum, o) => sum + Number(o.totalPrice ?? 0),
    0,
  );
  const todayOrders = orders.filter((o) => isToday(new Date(o.createdAt)));
  const todayRevenue = todayOrders.reduce(
    (sum, o) => sum + Number(o.totalPrice ?? 0),
    0,
  );
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const completedOrders = orders.filter(
    (o) => o.status === "COMPLETED" && new Date(o.createdAt) >= monthStart,
  );
  const pendingAmount = pendingOrders.reduce(
    (sum, o) => sum + Number(o.totalPrice ?? 0),
    0,
  );

  const { partialOrders, totalBalanceDue } = usePartialPaymentStats(orders);

  if (salesLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
        <DashboardHeroCard
          title="Month Revenue"
          value={monthRevenue}
          icon={Receipt}
          footerText={`${monthOrders.length} orders`}
          bgClass="bg-[#fe9f43]"
          delay={0}
        />

        <DashboardHeroCard
          title="Today's Revenue"
          value={todayRevenue}
          icon={TrendingUp}
          footerText={`${todayOrders.length} order${todayOrders.length === 1 ? "" : "s"}`}
          bgClass="bg-[#092c4c]"
          delay={80}
        />

        <DashboardHeroCard
          title="Total Orders"
          value={salesData?.pagination?.total ?? 0}
          icon={BaggageClaim}
          footerText="All time"
          bgClass="bg-[#0e9384]"
          delay={160}
          isCurrency={false}
        />

        <DashboardHeroCard
          title="Total Products"
          value={totalProductCount}
          icon={Package}
          footerText="In catalog"
          bgClass="bg-[#155eef]"
          delay={240}
          isCurrency={false}
        />

        <PartialPaymentHeroCard
          count={partialOrders.length}
          totalBalanceDue={totalBalanceDue}
          delay={320}
        />
      </div>

      <Separator className="my-4" />

      {/* Order Status Breakdown */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
        <DashboardCompactCard
          title="Pending Orders"
          value={pendingOrders.length}
          icon={Clock}
          colorClass="text-amber-600 dark:text-amber-400"
          iconBgClass="bg-amber-100 dark:bg-amber-900/30"
          detailLabel="Total Amount"
          detailValue={fmtCurrency(pendingAmount)}
          delay={320}
        />

        <DashboardCompactCard
          title="Completed (Month)"
          value={completedOrders.length}
          icon={CheckCircle2}
          colorClass="text-green-600 dark:text-green-400"
          iconBgClass="bg-green-100 dark:bg-green-900/30"
          detailLabel="Success Rate"
          detailValue={`${monthOrders.length > 0 ? Math.round((completedOrders.length / monthOrders.length) * 100) : 0}%`}
          delay={400}
        />

        <DashboardCompactCard
          title="Avg Order Value"
          value={monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0}
          icon={ShoppingCart}
          colorClass="text-blue-600 dark:text-blue-400"
          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
          detailLabel="Based on"
          detailValue={`${monthOrders.length} orders`}
          delay={480}
        />

        <PartialPaymentCompactCard
          count={partialOrders.length}
          totalBalanceDue={totalBalanceDue}
          delay={560}
        />
      </div>
    </div>
  );
}
