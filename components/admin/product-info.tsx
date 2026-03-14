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
} from "../ui/select";
import { Boxes, CalendarDays, CircleAlert, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { isToday, isThisWeek, isThisMonth, isThisYear, format } from "date-fns";
import { useGetProducts } from "@/hooks/useProduct";
import { useGetSales } from "@/hooks/useSale";
import { OrderWithRelations } from "@/schemas/type-export.schema";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

// ── types ─────────────────────────────────────────────────────────────────

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

// ── helpers ────────────────────────────────────────────────────────────────

function lowestStock(product: ProductItem) {
  if (!product.variants.length) return Infinity;
  return Math.min(...product.variants.map((v) => v.stock));
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

// ── sub-components ──────────────────────────────────────────────────────────

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

// ── main component ──────────────────────────────────────────────────────────

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

  // Low stock: products where any variant has stock < 10
  const lowStockProducts = products
    .filter((p) => p.variants.some((v) => v.stock < 10))
    .sort((a, b) => lowestStock(a) - lowestStock(b));

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
    .filter((p) => p._periodSold > 0)
    .sort((a, b) => b._periodSold - a._periodSold);

  // Recent sales filtered by date
  const filteredOrders = filterOrdersByDate(orders, salesFilter);

  return (
    <div>
      <div className="grid auto-rows-min gap-4 lg:grid-cols-3 mt-4">
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
              <CircleAlert className="h-4 w-4 text-yellow-400" />
              <h4 className="font-bold">Low Stock Products</h4>
            </div>
            <div className="h-10 flex items-center justify-center px-3 py-2 border rounded-md min-w-30">
              <Link href="/stock/adjust" className="text-sm underline">
                Adjust Stock
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
              {lowStockProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All products have sufficient stock
                </p>
              )}
              {lowStockProducts.length > 0 && (
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 5).map((product) => {
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
                          <p className="font-medium text-sm truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {`SKU: ${product.sku}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <p className="text-sm font-semibold">Stock</p>
                          <p
                            className={`text-xs font-medium ${minStock === 0 ? "text-red-600" : "text-amber-600"}`}
                          >
                            {minStock === 0
                              ? "Out of stock"
                              : `${minStock} left`}
                          </p>
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
