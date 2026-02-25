"use client";

import { useState, useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetSales } from "@/hooks/useSale";
import { useGetInvoices } from "@/hooks/useInvoice";
import { useGetQuotations } from "@/hooks/useQuotation";
import {
  OrderWithRelations,
  QuotationWithItems,
} from "@/schemas/type-export.schema";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(142, 76%, 36%)",
  },
  orders: {
    label: "Orders",
    color: "hsl(217, 91%, 53%)",
  },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

export default function RevenueExpenseChart() {
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));

  const { data: allSalesData, isLoading: chartLoading } = useGetSales(1, 1000);
  const { data: recentSalesData, isLoading: salesLoading } = useGetSales(1, 8);
  const { data: invoicesData, isLoading: invoicesLoading } = useGetInvoices(
    1,
    8,
  );
  const { data: quotationsData, isLoading: quotationsLoading } =
    useGetQuotations(1, 8);

  const recentOrders = (recentSalesData?.data ?? []) as OrderWithRelations[];
  const recentInvoices = (invoicesData?.data ?? []) as (OrderWithRelations & {
    invoiceNumber?: string;
  })[];
  const recentQuotations = (quotationsData?.data ?? []) as QuotationWithItems[];

  // Build monthly chart data from real orders for the selected year
  const chartData = useMemo(() => {
    const rawOrders = (allSalesData?.data ?? []) as OrderWithRelations[];
    const year = Number(selectedYear);
    return MONTHS.map((month, i) => {
      const monthOrders = rawOrders.filter((o) => {
        const d = new Date(o.createdAt as unknown as string);
        return d.getFullYear() === year && d.getMonth() === i;
      });
      const revenue = monthOrders.reduce(
        (sum, o) => sum + Number(o.totalPrice ?? 0),
        0,
      );
      const orders = monthOrders.length;
      return { month, revenue, orders };
    });
  }, [allSalesData, selectedYear]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);
  const avgMonthly =
    totalOrders > 0
      ? totalRevenue / chartData.filter((d) => d.revenue > 0).length || 0
      : 0;

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-2">
      <div className="w-auto min-h-screen">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Monthly Revenue & Expenses</CardTitle>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-auto min-w-30">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Year</SelectLabel>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Separator className="my-2" />
            <CardDescription>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                {chartLoading ? (
                  <div className="col-span-3 flex justify-center py-4">
                    <Spinner className="size-5" />
                  </div>
                ) : (
                  <>
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <CardDescription className="text-green-600 dark:text-green-400 font-semibold">
                          Total Revenue
                        </CardDescription>
                        <CardTitle className="text-2xl text-green-700 dark:text-green-300">
                          $
                          {totalRevenue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-2">
                        <CardDescription className="text-blue-600 dark:text-blue-400 font-semibold">
                          Total Orders
                        </CardDescription>
                        <CardTitle className="text-2xl text-blue-700 dark:text-blue-300">
                          {totalOrders.toLocaleString()}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                      <CardHeader className="pb-2">
                        <CardDescription className="text-purple-600 dark:text-purple-400 font-semibold">
                          Avg Monthly
                        </CardDescription>
                        <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">
                          $
                          {avgMonthly.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </>
                )}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <div className="flex justify-center py-10">
                <Spinner className="size-6" />
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="w-full">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) =>
                      v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          name === "revenue"
                            ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : String(value)
                        }
                      />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="w-auto min-h-screen">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="h-10 flex items-center justify-center px-3 py-2 border rounded-md bg-background min-w-30">
                <Link href="#" className="text-sm text-primary underline">
                  View All
                </Link>
              </div>
            </div>
            <Separator className="my-2" />
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className={"w-full items-stretch"}>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="purchase">Purchase</TabsTrigger>
                <TabsTrigger value="quotation">Quotation</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
                <TabsTrigger value="invoice">Invoice</TabsTrigger>
              </TabsList>

              <TabsContent value="sales">
                {salesLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner className="size-5" />
                  </div>
                ) : (
                  <>
                    {recentOrders.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 mt-4">
                        No recent sales
                      </p>
                    )}
                    {recentOrders.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {order.customer?.name ?? "Guest"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                #{order.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">
                                ${Number(order.totalPrice ?? 0).toFixed(2)}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  order.status === "COMPLETED"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {order.status.charAt(0) +
                                  order.status.slice(1).toLowerCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground w-16 text-right">
                                {format(new Date(order.createdAt), "MMM dd")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="purchase">
                <CardDescription className="mt-4">
                  {/*TODO / */}
                  Purchase transactions will be displayed here.
                </CardDescription>
              </TabsContent>

              <TabsContent value="quotation">
                {quotationsLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner className="size-5" />
                  </div>
                ) : (
                  <>
                    {recentQuotations.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 mt-4">
                        No recent quotations
                      </p>
                    )}
                    {recentQuotations.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {recentQuotations.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {(q as { customer?: { name?: string } })
                                  .customer?.name ?? "Guest"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                #{q.quotationNumber ?? q.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">
                                ${Number(q.totalAmount ?? 0).toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground w-16 text-right">
                                {format(
                                  new Date(q.createdAt as unknown as string),
                                  "MMM dd",
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="expense">
                <CardDescription className="mt-4">
                  {/*TODO / */}
                  Expense transactions will be displayed here.
                </CardDescription>
              </TabsContent>

              <TabsContent value="invoice">
                {invoicesLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner className="size-5" />
                  </div>
                ) : (
                  <>
                    {recentInvoices.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 mt-4">
                        No recent invoices
                      </p>
                    )}
                    {recentInvoices.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {recentInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {inv.customer?.name ?? "Guest"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                #
                                {inv.invoiceNumber
                                  ? `${inv.invoiceNumber}`
                                  : "###"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">
                                ${Number(inv.totalPrice ?? 0).toFixed(2)}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  inv.status === "COMPLETED"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {inv.status.charAt(0) +
                                  inv.status.slice(1).toLowerCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground w-16 text-right">
                                {format(new Date(inv.createdAt), "MMM dd")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
