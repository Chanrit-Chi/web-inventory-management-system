"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Archive, Boxes, CalendarDays, CircleAlert, Package, ShoppingBag, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { isToday, isThisWeek, isThisMonth, isThisYear, format } from "date-fns";
import { useGetProducts } from "@/hooks/useProduct";
import { useGetSales } from "@/hooks/useSale";
import { OrderWithRelations } from "@/schemas/type-export.schema";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { DashboardMetricCard } from "../dashboard-cards";


type VariantItem = {
  id: number;
  sku: string;
  stock: number;
  isActive: boolean;
  _count?: { orderDetail: number };
  attributes?: Array<{
    value?: { value: string; attribute?: { name: string } };
  }>;
};

type ProductItem = {
  id: string;
  name: string;
  image: string | null;
  sku: string;
  isActive: boolean;
  variants: VariantItem[];
  category?: { name: string } | null;
};

function lowestStock(product: ProductItem) {
  const activeVariants = product.variants.filter((v) => v.isActive);
  if (!activeVariants.length) return Infinity;
  return Math.min(...activeVariants.map((v) => v.stock));
}

function formatDateDisplay(dateString: string) {
  const d = new Date(dateString);
  if (isToday(d)) return "Today";
  if (isThisWeek(d)) return format(d, "EEE");
  if (isThisMonth(d)) return format(d, "MMM dd");
  return format(d, "MMM dd, yy");
}

const statusStyle: Record<string, string> = {
  COMPLETED:
    "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200",
  PENDING:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200",
  CANCELLED:
    "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200",
};

type DateFilter = "today" | "weekly" | "monthly" | "yearly";

function filterOrdersByDate(
  orders: OrderWithRelations[],
  filter: DateFilter,
): OrderWithRelations[] {
  return orders.filter((o) => {
    const d = new Date(o.createdAt);
    if (filter === "today") return isToday(d);
    if (filter === "weekly") return isThisWeek(d);
    if (filter === "monthly") return isThisMonth(d);
    if (filter === "yearly") return isThisYear(d);
    return true;
  });
}

function DateSelect({
  value,
  onChange,
}: {
  readonly value: DateFilter;
  readonly onChange: (v: DateFilter) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DateFilter)}>
      <SelectTrigger className="w-auto min-w-30">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Period</SelectLabel>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}


export default function ProductInfo() {
  const [topFilter, setTopFilter] = useState<DateFilter>("monthly");
  const [salesFilter, setSalesFilter] = useState<DateFilter>("today");

  const { data: productsData, isLoading: productsLoading } = useGetProducts(
    1,
    50,
  );
  const { data: salesData, isLoading: salesLoading } = useGetSales(1, 50);

  const products = (productsData?.data ?? []) as ProductItem[];
  const orders = (salesData?.data ?? []) as OrderWithRelations[];

  // Low stock: active products where any active variant has 0 < stock < 10
  const lowStockProducts = products
    .filter((p) =>
      p.isActive &&
      p.variants.some((v) => v.isActive && v.stock > 0 && v.stock < 10),
    )
    .sort((a, b) => lowestStock(a) - lowestStock(b));

  // Out of stock: active products where all active variants have 0 stock
  const outOfStockProducts = products.filter((p) =>
    p.isActive &&
    p.variants.some((v) => v.isActive) &&
    p.variants.filter((v) => v.isActive).every((v) => v.stock === 0),
  );

  const activeProducts = products.filter((p) => p.isActive).length;
  const totalUnits = products.reduce((sum, p) => {
    if (!p.isActive) return sum;
    return sum + p.variants.filter(v => v.isActive).reduce((vSum, v) => vSum + v.stock, 0);
  }, 0);

  // Top selling: count units sold within the selected period from order details
  const topFilteredOrders = filterOrdersByDate(orders, topFilter);
  const periodSoldMap = new Map<string, number>();
  topFilteredOrders.forEach((order) => {
    (order.orderDetail ?? []).forEach((detail) => {
      const qty = (detail as { quantity?: number }).quantity ?? 1;
      periodSoldMap.set(
        detail.productId,
        (periodSoldMap.get(detail.productId) ?? 0) + qty,
      );
    });
  });
  const topSelling = [...products]
    .map((p) => ({ ...p, _periodSold: periodSoldMap.get(p.id) ?? 0 }))
    .filter((p) => p.isActive && p._periodSold > 0)
    .sort((a, b) => b._periodSold - a._periodSold);

  // Recent sales filtered by date
  const filteredOrders = filterOrdersByDate(orders, salesFilter);

  return (
    <div className="space-y-6">
      {/* Inventory Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <DashboardMetricCard
          title="Active Products"
          value={activeProducts}
          icon={Package}
          colorClass=""
          iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
          borderClass="border-blue-500/20"
          hoverBorderClass="hover:border-blue-500/30"
          delay={0}
        />

        <DashboardMetricCard
          title="Low Stock"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          colorClass="text-amber-600 dark:text-amber-400"
          iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
          borderClass="border-amber-500/20"
          hoverBorderClass="hover:border-amber-500/30"
          delay={80}
          href="/stock/alerts"
        />

        <DashboardMetricCard
          title="Out of Stock"
          value={outOfStockProducts.length}
          icon={TrendingDown}
          colorClass="text-red-600 dark:text-red-400"
          iconBgClass="bg-red-500/10 dark:bg-red-500/20"
          borderClass="border-red-500/20"
          hoverBorderClass="hover:border-red-500/30"
          delay={160}
          href="/stock/alerts"
        />

        <DashboardMetricCard
          title="Total Units"
          value={totalUnits}
          icon={Archive}
          colorClass=""
          iconBgClass="bg-green-500/10 dark:bg-green-500/20"
          borderClass="border-green-500/20"
          hoverBorderClass="hover:border-green-500/30"
          delay={240}
        />
      </div>

      <div className="grid auto-rows-min gap-4 lg:grid-cols-3">
        {/* Top Selling Products */}
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-red-400" />
              <h4 className="font-bold">Top Selling Products</h4>
            </div>
            <DateSelect value={topFilter} onChange={setTopFilter} />
          </div>
          <Separator className="my-3" />
          {productsLoading || salesLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          ) : (
            <>
              {topSelling.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sales in this period
                </p>
              )}
              {topSelling.length > 0 && (
                <div className="space-y-2">
                  {topSelling.slice(0, 5).map((product, i) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover size-10"
                          />
                        ) : (
                          <div className="size-10 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {i + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.category?.name ?? "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          {product._periodSold}
                        </p>
                        <p className="text-xs text-muted-foreground">sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-rose-500" />
              <h4 className="font-bold">Inventory Alerts</h4>
            </div>
            <div className="h-10 flex items-center justify-center px-3 py-2 border rounded-md min-w-30">
              <Link href="/stock/alerts" className="text-sm underline">
                View All Alerts
              </Link>
            </div>
          </div>
          <Separator className="my-3" />
          {productsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          ) : (
            <>
              {(lowStockProducts.length === 0 && outOfStockProducts.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All products have sufficient stock
                </p>
              )}
              
              {/* Out of Stock Section */}
              {outOfStockProducts.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Out of Stock</p>
                  {outOfStockProducts.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center gap-3">
                       <div className="size-10 shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="rounded-md object-cover size-10 grayscale"
                          />
                        ) : (
                          <div className="size-10 rounded-md bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                            <ShoppingBag className="size-4 text-rose-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{`SKU: ${product.sku}`}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Empty</Badge>
                      </div>
                    </div>
                  ))}
                  {outOfStockProducts.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground">+ {outOfStockProducts.length - 3} more out of stock</p>
                  )}
                </div>
              )}

              {/* Low Stock Section */}
              {lowStockProducts.length > 0 && (
                <div className="space-y-2">
                  {outOfStockProducts.length > 0 && <Separator className="my-3 opacity-50" />}
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Low Stock</p>
                  {lowStockProducts.slice(0, 5 - Math.min(3, outOfStockProducts.length)).map((product) => {
                    const minStock = lowestStock(product);
                    return (
                      <div key={product.id} className="flex items-center gap-3">
                        <div className="size-10 shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="rounded-md object-cover size-10"
                            />
                          ) : (
                            <div className="size-10 rounded-md bg-muted flex items-center justify-center">
                              <ShoppingBag className="size-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{`SKU: ${product.sku}`}</p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <p className="text-sm font-semibold">Stock</p>
                          <p className="text-xs font-medium text-amber-600">{minStock} left</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent Sales */}
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-blue-400" />
              <h4 className="font-bold">Recent Sales</h4>
            </div>
            <DateSelect value={salesFilter} onChange={setSalesFilter} />
          </div>
          <Separator className="my-3" />
          {salesLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="size-5" />
            </div>
          ) : (
            <>
              {filteredOrders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sales in this period
                </p>
              )}
              {filteredOrders.length > 0 && (
                <div className="space-y-2">
                  {filteredOrders.slice(0, 5).map((order) => {
                    const name = order.customer?.name ?? "Guest";
                    const words = name.split(" ").filter(Boolean);
                    const initials = (
                      words.length >= 2
                        ? words[0][0] + words[1][0]
                        : name.slice(0, 2)
                    ).toUpperCase();
                    const colors = [
                      "bg-blue-200 text-blue-800",
                      "bg-emerald-200 text-emerald-800",
                      "bg-violet-200 text-violet-800",
                      "bg-orange-200 text-orange-800",
                      "bg-rose-200 text-rose-800",
                      "bg-cyan-200 text-cyan-800",
                      "bg-amber-200 text-amber-800",
                      "bg-pink-200 text-pink-800",
                    ];
                    const colorIdx =
                      name
                        .split("")
                        .reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0) %
                      colors.length;
                    return (
                      <div key={order.id} className="flex items-center gap-3">
                        <div
                          className={`size-10 shrink-0 rounded-md ${colors[colorIdx]} flex items-center justify-center text-xs font-bold`}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {order.customer?.name ?? "Guest"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${Number(order.totalPrice ?? 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDateDisplay(
                              order.createdAt as unknown as string,
                            )}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] mt-0.5 ${statusStyle[order.status] ?? "bg-muted"}`}
                          >
                            {order.status.charAt(0) +
                              order.status.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
