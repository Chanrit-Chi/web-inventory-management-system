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

      <Separator className="my-4" />

      {/* Order Status Breakdown */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-3">
        <div className="bg-card aspect-auto rounded-xl p-6 border">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Pending Orders
                </h3>
                <p className="text-2xl text-amber-600 dark:text-amber-400 font-bold mt-1">
                  {pendingOrders.length}
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

        <div className="bg-card aspect-auto rounded-xl p-6 border">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Completed (Month)
                </h3>
                <p className="text-2xl text-green-600 dark:text-green-400 font-bold mt-1">
                  {completedOrders.length}
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

        <div className="bg-card aspect-auto rounded-xl p-6 border">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Avg Order Value
                </h3>
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
              <p className="text-sm font-semibold">
                {monthOrders.length} orders
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
