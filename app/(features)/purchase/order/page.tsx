"use client";

import { useState } from "react";
import { SharedLayout } from "@/components/shared-layout";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RefreshCcw, ShoppingCart } from "lucide-react";
import { useGetPurchaseOrders } from "@/hooks/usePurchaseOrder";
import { columns } from "./columns";
import { useRouter } from "next/navigation";

function PurchaseOrderList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const router = useRouter();

  const {
    data: orders,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetPurchaseOrders(page, limit, search, filters);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="w-full px-2 md:px-3 py-3">
      <div className="flex gap-2 items-center mb-4">
        <ShoppingCart className="size-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
      </div>

      <div className="flex justify-end items-center gap-2 mb-2">
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          variant="outline"
          size="sm"
        >
          {isFetching ? (
            <Spinner className="size-4" />
          ) : (
            <RefreshCcw className="size-4" />
          )}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={orders?.data ?? []}
        showAddNew
        addNewLabel="New Order"
        onAddNew={() => router.push("/purchase/new-order")}
        paginationMeta={orders?.pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
        searchValue={search}
        filterValues={filters}
        searchPlaceholder="Search by PO number or supplier..."
        rowFilters={[
          {
            columnId: "status",
            label: "Status",
            options: [
              { value: "PENDING", label: "Pending" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ],
          },
        ]}
      />
    </div>
  );
}

export default function PurchaseOrderPage() {
  return (
    <SharedLayout>
      <PurchaseOrderList />
    </SharedLayout>
  );
}
