import {
  ArrowDownUp,
  BaggageClaim,
  HandCoins,
  Receipt,
  Warehouse,
} from "lucide-react";
import React from "react";
import { Separator } from "../ui/separator";
import Link from "next/link";

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Sale/order part */}
      <div className="grid auto-rows-min gap-4 lg:grid-cols-4">
        <div className="flex justify-between bg-[#fe9f43] aspect-auto rounded-xl p-6">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">Total Sales</h3>
            <p className="text-2xl text-neutral-50 font-bold">$24,580.00</p>
            <p className="text-xs text-green-600 bg-neutral-50 w-max px-2 rounded-full mt-1">
              +8% this month
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Receipt className="h-12 w-12 text-neutral-50" />
          </div>
        </div>

        <div className="flex justify-between bg-[#092c4c] aspect-auto rounded-xl p-6">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">
              Sale Returns
            </h3>
            <p className="text-2xl text-neutral-50 font-bold">12</p>
            <p className="text-xs text-blue-600 bg-neutral-50 w-max px-2 rounded-full mt-1">
              -2% this month
            </p>
          </div>
          <div className="flex items-center justify-center">
            <ArrowDownUp className="h-12 w-12 text-neutral-50" />
          </div>
        </div>

        <div className="bg-[#0e9384] aspect-auto rounded-xl p-6 flex justify-between">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">
              Total Orders
            </h3>
            <p className="text-2xl text-neutral-50 font-bold">187</p>
            <p className="text-xs text-purple-600 bg-neutral-50 w-max px-2 rounded-full mt-1">
              This month
            </p>
          </div>
          <div className="flex items-center justify-center">
            <BaggageClaim className="h-12 w-12 text-neutral-50" />
          </div>
        </div>

        <div className="bg-[#155eef] aspect-auto rounded-xl p-6 flex justify-between">
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-medium text-neutral-50">
              Order Return
            </h3>
            <p className="text-2xl text-neutral-50 font-bold">$45,200</p>
            <p className="text-xs text-orange-600 bg-neutral-50 w-max px-2 rounded-full mt-1">
              185 products
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Warehouse className="h-12 w-12 text-neutral-50" />
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
                <h3 className="text-sm font-medium">Profit</h3>
                <p className="text-2xl text-[#fe9f43] dark:text-orange-400 font-bold">
                  $444,520.00
                </p>
              </div>
              <HandCoins className="h-12 w-12 text-[#fe9f43] dark:text-orange-400" />
            </div>
            <Separator className="my-2 bg-[#fe9f43] dark:bg-orange-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-orange-600 dark:text-orange-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                -10% vs last month
              </p>
              <Link href="/sale/report" className="text-xs underline">
                View Report
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-card aspect-auto rounded-xl p-6 border">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Invoice Due</h3>
                <p className="text-2xl text-[#092c4c] dark:text-blue-400 font-bold">
                  $180,320.00
                </p>
              </div>
              <HandCoins className="h-12 w-12 text-[#092c4c] dark:text-blue-400" />
            </div>
            <Separator className="my-2 bg-[#092c4c] dark:bg-blue-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-green-600 dark:text-green-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                +5% vs last month
              </p>
              <Link
                href="/expense/report"
                className="text-xs underline text-[#092c4c] dark:text-blue-400"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-card aspect-auto rounded-xl p-6 border">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Total Expense</h3>
                <p className="text-2xl text-[#0e9384] dark:text-teal-400 font-bold">
                  $264,200.00
                </p>
              </div>
              <Receipt className="h-12 w-12 text-[#0e9384] dark:text-teal-400" />
            </div>
            <Separator className="my-2 bg-[#0e9384] dark:bg-teal-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-green-600 dark:text-green-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                +12% vs last month
              </p>
              <Link href="/income/report" className="text-xs underline ">
                View Analysis
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-card aspect-auto rounded-xl p-6 border">
          <div className="flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium">Total payment returns</h3>
                <p className="text-2xl text-[#155eef] dark:text-blue-400 font-bold">
                  $1,247.00
                </p>
              </div>
              <ArrowDownUp className="h-12 w-12 text-[#155eef] dark:text-blue-400" />
            </div>
            <Separator className="my-2 bg-[#155eef] dark:bg-blue-400" />
            <div className="flex justify-between items-center">
              <p className="text-xs text-red-600 dark:text-red-400 bg-neutral-50 dark:bg-neutral-800 w-max px-2 rounded-full mt-1">
                -20% vs last month
              </p>
              <Link href="/users/activity" className="text-xs underline ">
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
