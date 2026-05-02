"use client";

import {
  BaggageClaim,
  CheckCircle2,
  Clock,
  HandCoins,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import React from "react";
import { Separator } from "../../ui/separator";
import { isToday, startOfMonth } from "date-fns";
import { useGetSales } from "@/hooks/useSale";
import { useGetProducts } from "@/hooks/useProduct";
import { useGetExpenses } from "@/hooks/useExpense";
import { Expense, OrderWithRelations } from "@/schemas/type-export.schema";
import { Spinner } from "@/components/ui/spinner";
import {
  DashboardHeroCard,
  DashboardDetailCard,
  PartialPaymentHeroCard,
  PartialPaymentDetailCard,
  usePartialPaymentStats,
  fmtCurrency,
} from "../dashboard-cards";


export default function DashboardOverview() {
  const { data: salesData, isLoading: salesLoading } = useGetSales(1, 100);
  const { data: expensesData, isLoading: expensesLoading } = useGetExpenses();
  const { data: productsData } = useGetProducts(1, 1);

  const orders = (salesData?.data ?? []) as OrderWithRelations[];
  const expenses: Expense[] = expensesData ?? [];
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
  const pendingAmount = pendingOrders.reduce(
    (sum, o) => sum + Number(o.totalPrice ?? 0),
    0,
  );

  const monthExpenses = expenses.filter(
    (expense) => new Date(expense.expenseDate) >= monthStart,
  );
  const monthExpenseAmount = monthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0,
  );
  const netMonth = monthRevenue - monthExpenseAmount;

  const { partialOrders, totalBalanceDue } = usePartialPaymentStats(orders);

  if (salesLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sale/order part */}
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

        <PartialPaymentHeroCard
          count={partialOrders.length}
          totalBalanceDue={totalBalanceDue}
          delay={320}
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
      </div>

      {/* Separator between sections */}
      <Separator className="my-4" />

      {/* Income/expense part */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-5">
        <DashboardDetailCard
          title="Month Sales"
          value={monthRevenue}
          icon={HandCoins}
          footerLabel="orders"
          footerValue={monthOrders.length}
          href="/sales/all-sale"
          colorClass="text-[#fe9f43] dark:text-orange-400"
          separatorClass="bg-[#fe9f43] dark:bg-orange-400"
          delay={320}
        />

        <DashboardDetailCard
          title="Month Expenses"
          value={monthExpenseAmount}
          icon={Receipt}
          footerLabel={`expense${monthExpenses.length === 1 ? "" : "s"}`}
          footerValue={monthExpenses.length}
          href="/expenses"
          hrefLabel="View Expenses"
          colorClass="text-red-600 dark:text-red-400"
          separatorClass="bg-red-600 dark:bg-red-400"
          delay={400}
        />

        <DashboardDetailCard
          title="Net (Month)"
          value={netMonth}
          icon={CheckCircle2}
          footerLabel="Rev-Exp"
          footerValue=""
          href="/expenses"
          hrefLabel="View Expenses"
          colorClass="text-[#0e9384] dark:text-teal-400"
          separatorClass="bg-[#0e9384] dark:bg-teal-400"
          delay={480}
        />

        <DashboardDetailCard
          title="Pending Orders"
          value={pendingOrders.length}
          icon={Clock}
          footerLabel=""
          footerValue={fmtCurrency(pendingAmount)}
          href="/sales/all-sale"
          hrefLabel="View Pending"
          colorClass="text-[#155eef] dark:text-blue-400"
          separatorClass="bg-[#155eef] dark:bg-blue-400"
          delay={560}
          isCurrency={false}
        />

        {/* Partial Payments Card */}
        <PartialPaymentDetailCard
          count={partialOrders.length}
          totalBalanceDue={totalBalanceDue}
          delay={640}
        />
      </div>
    </div>
  );
}
