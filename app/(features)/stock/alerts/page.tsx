"use client";

import { SharedLayout } from "@/components/shared-layout";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetProducts } from "@/hooks/useProduct";
import { columns } from "./columns";
import { useState, useMemo } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StockAlertsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Fetch more to find enough alerts
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    stockStatus: "alert",
  });

  const {
    data: productsData,
    isLoading,
    error,
  } = useGetProducts(page, limit, search, filters);

  const products = productsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) return <div>Error: {error.message}</div>;

  return (
    <SharedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button asChild variant="ghost" size="sm" className="-ml-2 h-8">
                <Link href="/dashboard/admin">
                  <ArrowLeft className="size-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="size-6 text-rose-500" />
              Inventory Stock Alerts
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage products that are out of stock or running low.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/stock/adjust">Adjust All Stock</Link>
          </Button>
        </div>

        <div className="bg-card rounded-xl border p-4">
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Filter alerts..."
            onSearchChange={setSearch}
            onFilterChange={setFilters}
            searchValue={search}
            filterValues={filters}
            baseFilters={{ stockStatus: "alert" }}
          />
        </div>
      </div>
    </SharedLayout>
  );
}
