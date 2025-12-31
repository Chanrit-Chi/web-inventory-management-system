"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
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

// Type for chart data
type ChartData = {
  month: string;
  revenue: number;
  expense: number;
  profit?: number;
};

// Sample data - expenses as negative values
const data: ChartData[] = [
  { month: "Jan", revenue: 4500, expense: -3200 },
  { month: "Feb", revenue: 5200, expense: -2800 },
  { month: "Mar", revenue: 4800, expense: -3500 },
  { month: "Apr", revenue: 6100, expense: -4200 },
  { month: "May", revenue: 5500, expense: -3800 },
  { month: "Jun", revenue: 7200, expense: -4500 },
  { month: "Jul", revenue: 6800, expense: -4100 },
  { month: "Aug", revenue: 7500, expense: -4800 },
  { month: "Sep", revenue: 6900, expense: -4300 },
  { month: "Oct", revenue: 8200, expense: -5100 },
  { month: "Nov", revenue: 7800, expense: -4900 },
  { month: "Dec", revenue: 9100, expense: -5600 },
];

// Calculate net profit for each month
const dataWithProfit: ChartData[] = data.map((item) => ({
  ...item,
  profit: item.revenue + item.expense,
}));

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(142, 76%, 36%)",
  },
  expense: {
    label: "Expenses",
    color: "hsl(0, 84%, 60%)",
  },
};

// Extracted formatter component

// Formatter compatible with recharts Formatter<ValueType, NameType>
const CustomTooltipFormatter = (
  value: number | string | (number | string)[],
  name: string | number
) => {
  let displayValue = value;
  if (Array.isArray(value)) {
    displayValue = value[0];
  }
  const nameStr = String(name);
  return `${
    chartConfig[nameStr as keyof typeof chartConfig]?.label || nameStr
  }: $${Math.abs(Number(displayValue)).toLocaleString()}`;
};

export default function RevenueExpenseChart() {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpense = Math.abs(
    data.reduce((sum, item) => sum + item.expense, 0)
  );
  const totalProfit = dataWithProfit.reduce(
    (sum, item) => sum + (item.profit ?? 0),
    0
  );

  return (
    <div className="grid auto-rows-min gap-4 lg:grid-cols-2">
      <div className="w-auto min-h-screen">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Monthly Revenue & Expenses</CardTitle>
              <Select defaultValue="2025">
                <SelectTrigger className="w-auto min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <SelectValue placeholder="2025" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Year</SelectLabel>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Separator className="my-2" />
            <CardDescription>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-green-600 font-semibold">
                      Total Revenue
                    </CardDescription>
                    <CardTitle className="text-2xl text-green-700">
                      ${totalRevenue.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-red-600 font-semibold">
                      Total Expenses
                    </CardDescription>
                    <CardTitle className="text-2xl text-red-700">
                      ${totalExpense.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-600 font-semibold">
                      Net Profit
                    </CardDescription>
                    <CardTitle className="text-2xl text-blue-700">
                      ${totalProfit.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="w-full">
              <BarChart
                data={dataWithProfit}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap="0%"
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
                  tickFormatter={(value) => {
                    const absValue = Math.abs(value / 1000);
                    return value < 0
                      ? `-$${absValue.toFixed(0)}k`
                      : `$${absValue.toFixed(0)}k`;
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={CustomTooltipFormatter} />
                  }
                />
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[8, 8, 8, 8]}
                  barSize={60}
                />
                <Bar
                  dataKey="expense"
                  fill="var(--color-expense)"
                  radius={[8, 8, 8, 8]}
                  barSize={60}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <div className="w-auto min-h-screen">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="h-10 flex items-center justify-center px-3 py-2 border rounded-md bg-background min-w-[120px]">
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
                <CardDescription className="mt-4">
                  {/*TODO / */}
                  Sales transactions will be displayed here.
                </CardDescription>
              </TabsContent>

              <TabsContent value="purchase">
                <CardDescription className="mt-4">
                  {/*TODO / */}
                  Purchase transactions will be displayed here.
                </CardDescription>
              </TabsContent>

              <TabsContent value="quotation">
                <CardDescription className="mt-4">
                  {/*TODO / */}
                  Quotation transactions will be displayed here.
                </CardDescription>
              </TabsContent>

              <TabsContent value="expense">
                <CardDescription className="mt-4">
                  {/*TODO / */}
                  Expense transactions will be displayed here.
                </CardDescription>
              </TabsContent>

              <TabsContent value="invoice">
                <CardDescription className="mt-4">
                  {/*TODO / */}
                  Invoice transactions will be displayed here.
                </CardDescription>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
