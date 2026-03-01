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
        <div className="flex justify-between bg-[#fe9f43] aspect-auto rounded-xl p-6">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">
              Month Revenue
            </h3>
            <p className="text-2xl text-neutral-50 font-bold">
              {fmt(monthRevenue)}
            </p>
            <p className="text-xs bg-neutral-50/20 text-neutral-50 w-max px-2 rounded-full mt-1">
              {monthOrders.length} orders
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Receipt className="h-12 w-12 text-neutral-50/70" />
          </div>
        </div>

        <div className="flex justify-between bg-[#092c4c] aspect-auto rounded-xl p-6">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">
              Today&apos;s Revenue
            </h3>
            <p className="text-2xl text-neutral-50 font-bold">
              {fmt(todayRevenue)}
            </p>
            <p className="text-xs bg-neutral-50/20 text-neutral-50 w-max px-2 rounded-full mt-1">
              {todayOrders.length} order{todayOrders.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <TrendingUp className="h-12 w-12 text-neutral-50/70" />
          </div>
        </div>

        <div className="bg-[#0e9384] aspect-auto rounded-xl p-6 flex justify-between">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">
              Total Orders
            </h3>
            <p className="text-2xl text-neutral-50 font-bold">
              {salesData?.pagination?.total ?? 0}
            </p>
            <p className="text-xs bg-neutral-50/20 text-neutral-50 w-max px-2 rounded-full mt-1">
              All time
            </p>
          </div>
          <div className="flex items-center justify-center">
            <BaggageClaim className="h-12 w-12 text-neutral-50/70" />
          </div>
        </div>

        <div className="bg-[#155eef] aspect-auto rounded-xl p-6 flex justify-between">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">
              Total Products
            </h3>
            <p className="text-2xl text-neutral-50 font-bold">
              {totalProductCount}
            </p>
            <p className="text-xs bg-neutral-50/20 text-neutral-50 w-max px-2 rounded-full mt-1">
              In catalog
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Package className="h-12 w-12 text-neutral-50/70" />
          </div>
        </div>
      </div>

      {/* Separator between sections */}
      <Separator className="my-4" />

      {/* Income/expense part */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
        <div className="bg-card aspect-auto rounded-xl p-6 border">
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
                {monthOrders.length} orders
              </p>
              <Link href="/sales/all-sale" className="text-xs underline">
                View All
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-card aspect-auto rounded-xl p-6 border">
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
                {monthExpenses.length} expense
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
        <div className="bg-card aspect-auto rounded-xl p-6 border">
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
        <div className="bg-card aspect-auto rounded-xl p-6 border">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Pending Orders</h3>
                <p className="text-2xl text-[#155eef] dark:text-blue-400 font-bold">
                  {pendingOrders.length}
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
