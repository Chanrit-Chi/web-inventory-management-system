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
import { Separator } from "../ui/separator";
import Link from "next/link";
import { isToday, startOfMonth } from "date-fns";
import { useGetSales } from "@/hooks/useSale";
import { useGetProducts } from "@/hooks/useProduct";
import { useGetExpenses } from "@/hooks/useExpense";
import { Expense, OrderWithRelations } from "@/schemas/type-export.schema";
import { Spinner } from "@/components/ui/spinner";
import { useCountUp } from "@/hooks/useCountUp";

function fmt(val: number) {
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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

  // Count-up animations for integer values
  const animTotalOrders = useCountUp(salesData?.pagination?.total ?? 0);
  const animTotalProducts = useCountUp(totalProductCount);
  const animMonthOrders = useCountUp(monthOrders.length);
  const animTodayOrders = useCountUp(todayOrders.length);
  const animMonthExpenses = useCountUp(monthExpenses.length);
  const animPending = useCountUp(pendingOrders.length);

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
      <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
        <div
          className="animate-dash-enter relative overflow-hidden bg-[#fe9f43] rounded-xl p-6 min-h-30 flex flex-col justify-between"
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex flex-col justify-center z-10">
            <h3 className="text-sm font-medium text-neutral-50/90 uppercase tracking-wide">
              Month Revenue
            </h3>
            <p className="text-2xl text-white font-bold tracking-tight">
              {fmt(monthRevenue)}
            </p>
          </div>
          <div className="z-10 mt-auto">
            <p className="text-[10px] bg-white/20 text-white w-max px-2 py-0.5 rounded-full backdrop-blur-sm">
              {animMonthOrders} orders
            </p>
          </div>
          <Receipt className="absolute -right-4 -top-4 h-24 w-24 text-white/15 rotate-12" />
        </div>

        <div
          className="animate-dash-enter relative overflow-hidden bg-[#092c4c] rounded-xl p-6 min-h-30 flex flex-col justify-between"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex flex-col justify-center z-10">
            <h3 className="text-sm font-medium text-neutral-50/90 uppercase tracking-wide">
              Today&apos;s Revenue
            </h3>
            <p className="text-2xl text-white font-bold tracking-tight">
              {fmt(todayRevenue)}
            </p>
          </div>
          <div className="z-10 mt-auto">
            <p className="text-[10px] bg-white/20 text-white w-max px-2 py-0.5 rounded-full backdrop-blur-sm">
              {animTodayOrders} order{todayOrders.length === 1 ? "" : "s"}
            </p>
          </div>
          <TrendingUp className="absolute -right-4 -top-4 h-24 w-24 text-white/15 rotate-12" />
        </div>

        <div
          className="animate-dash-enter relative overflow-hidden bg-[#0e9384] rounded-xl p-6 min-h-30 flex flex-col justify-between"
          style={{ animationDelay: "160ms" }}
        >
          <div className="flex flex-col justify-center z-10">
            <h3 className="text-sm font-medium text-neutral-50/90 uppercase tracking-wide">
              Total Orders
            </h3>
            <p className="text-2xl text-white font-bold tracking-tight">
              {animTotalOrders}
            </p>
          </div>
          <div className="z-10 mt-auto">
            <p className="text-[10px] bg-white/20 text-white w-max px-2 py-0.5 rounded-full backdrop-blur-sm">
              All time
            </p>
          </div>
          <BaggageClaim className="absolute -right-4 -top-4 h-24 w-24 text-white/15 rotate-12" />
        </div>

        <div
          className="animate-dash-enter relative overflow-hidden bg-[#155eef] rounded-xl p-6 min-h-30 flex flex-col justify-between"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex flex-col justify-center z-10">
            <h3 className="text-sm font-medium text-neutral-50/90 uppercase tracking-wide">
              Total Products
            </h3>
            <p className="text-2xl text-white font-bold tracking-tight">
              {animTotalProducts}
            </p>
          </div>
          <div className="z-10 mt-auto">
            <p className="text-[10px] bg-white/20 text-white w-max px-2 py-0.5 rounded-full backdrop-blur-sm">
              In catalog
            </p>
          </div>
          <Package className="absolute -right-4 -top-4 h-24 w-24 text-white/15 rotate-12" />
        </div>
      </div>

      {/* Separator between sections */}
      <Separator className="my-4" />

      {/* Income/expense part */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
        <div
          className="animate-dash-enter bg-card aspect-auto rounded-xl p-6 border"
          style={{ animationDelay: "320ms" }}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Month Sales</h3>
                <p className="text-2xl text-[#fe9f43] dark:text-orange-400 font-bold">
                  {fmt(monthRevenue)}
                </p>
              </div>
              <HandCoins className="h-12 w-12 text-[#fe9f43] dark:text-orange-400" />
            </div>
            <Separator className="my-2 bg-[#fe9f43] dark:bg-orange-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-orange-600 dark:text-orange-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                {animMonthOrders} orders
              </p>
              <Link href="/sales/all-sale" className="text-xs underline">
                View All
              </Link>
            </div>
          </div>
        </div>
        <div
          className="animate-dash-enter bg-card aspect-auto rounded-xl p-6 border"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Month Expenses</h3>
                <p className="text-2xl text-red-600 dark:text-red-400 font-bold">
                  {fmt(monthExpenseAmount)}
                </p>
              </div>
              <Receipt className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <Separator className="my-2 bg-red-600 dark:bg-red-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-red-600 dark:text-red-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                {animMonthExpenses} expense
                {monthExpenses.length === 1 ? "" : "s"}
              </p>
              <Link
                href="/expenses"
                className="text-xs underline text-red-600 dark:text-red-400"
              >
                View Expenses
              </Link>
            </div>
          </div>
        </div>
        <div
          className="animate-dash-enter bg-card aspect-auto rounded-xl p-6 border"
          style={{ animationDelay: "480ms" }}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Net (Month)</h3>
                <p className="text-2xl text-[#0e9384] dark:text-teal-400 font-bold">
                  {fmt(netMonth)}
                </p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-[#0e9384] dark:text-teal-400" />
            </div>
            <Separator className="my-2 bg-[#0e9384] dark:bg-teal-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-teal-600 dark:text-teal-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                Revenue - Expense
              </p>
              <Link href="/expenses" className="text-xs underline">
                View Expenses
              </Link>
            </div>
          </div>
        </div>
        <div
          className="animate-dash-enter bg-card aspect-auto rounded-xl p-6 border"
          style={{ animationDelay: "560ms" }}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Pending Orders</h3>
                <p className="text-2xl text-[#155eef] dark:text-blue-400 font-bold">
                  {animPending}
                </p>
              </div>
              <Clock className="h-12 w-12 text-[#155eef] dark:text-blue-400" />
            </div>
            <Separator className="my-2 bg-[#155eef] dark:bg-blue-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-blue-600 dark:text-blue-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                {fmt(pendingAmount)}
              </p>
              <Link href="/sales/all-sale" className="text-xs underline">
                View Pending
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
