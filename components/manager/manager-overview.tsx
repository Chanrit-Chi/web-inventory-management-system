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
import { Separator } from "../ui/separator";
import { isToday, startOfMonth } from "date-fns";
import { useGetSales } from "@/hooks/useSale";
import { useGetProducts } from "@/hooks/useProduct";
import { OrderWithRelations } from "@/schemas/type-export.schema";
import { Spinner } from "@/components/ui/spinner";
import { useCountUp } from "@/hooks/useCountUp";

function fmt(val: number) {
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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

  const animTotalOrders = useCountUp(salesData?.pagination?.total ?? 0);
  const animTotalProducts = useCountUp(totalProductCount);
  const animMonthOrders = useCountUp(monthOrders.length);
  const animTodayOrders = useCountUp(todayOrders.length);
  const animPending = useCountUp(pendingOrders.length);
  const animCompleted = useCountUp(completedOrders.length);

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

      <Separator className="my-4" />

      {/* Order Status Breakdown */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-3">
        <div
          className="animate-dash-enter bg-card aspect-auto rounded-xl p-6 border"
          style={{ animationDelay: "320ms" }}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Pending Orders</h3>
                <p className="text-2xl text-amber-600 dark:text-amber-400 font-bold mt-1">
                  {animPending}
                </p>
              </div>
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="text-sm font-semibold">{fmt(pendingAmount)}</p>
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
                <h3 className="text-sm font-medium">Completed (Month)</h3>
                <p className="text-2xl text-green-600 dark:text-green-400 font-bold mt-1">
                  {animCompleted}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-sm font-semibold">
                {monthOrders.length > 0
                  ? Math.round(
                      (completedOrders.length / monthOrders.length) * 100,
                    )
                  : 0}
                %
              </p>
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
                <h3 className="text-sm font-medium">Avg Order Value</h3>
                <p className="text-2xl text-blue-600 dark:text-blue-400 font-bold mt-1">
                  {fmt(
                    monthOrders.length > 0
                      ? monthRevenue / monthOrders.length
                      : 0,
                  )}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">Based on</p>
              <p className="text-sm font-semibold">{animMonthOrders} orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
