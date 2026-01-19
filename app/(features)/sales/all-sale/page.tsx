"use client";

import { useGetSales } from "@/hooks/useSale";
import { useGetPaymentMethods } from "@/hooks/usePaymentMethod";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function Sale() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const {
    data: sales,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetSales(page, limit, search, filters);

  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } =
    useGetPaymentMethods();

  if (isLoading || isLoadingPaymentMethods)
    return (
      <div className="items-center justify-center flex min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );

  if (error) return <div>Error: {error.message}</div>;

  const paymentMethodOptions =
    paymentMethods?.map((pm) => ({
      value: pm.name,
      label: pm.name,
    })) ?? [];

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  return (
    <div className="container mx-auto py-3">
      <h1 className="text-2xl font-bold">Sales</h1>
      <div className="flex justify-end items-center gap-2">
        <Button className="btn btn-primary">XLSX</Button>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn btn-primary"
        >
          {isFetching ? (
            <Spinner className="size-4" />
          ) : (
            <RefreshCcw className="size-4 cursor-pointer" />
          )}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={sales?.data ?? []}
          showAddNew={true}
          addNewLabel="New Sale"
        addNewHref="/sales/new-sale"
        paginationMeta={sales?.pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        searchValue={search}
        filterValues={filters}
        rowFilters={[
          {
            columnId: "status",
            label: "Status",
            options: [
              { value: "COMPLETED", label: "Completed" },
              { value: "PENDING", label: "Pending" },
              { value: "CANCELLED", label: "Cancelled" },
            ],
          },

          {
            columnId: "paymentMethod.name",
            label: "Payment Via",
            options: paymentMethodOptions,
          },
        ]}
      />
    </div>
  );
}

export default function SalePage() {
  return (
    <SharedLayout>
      <Sale />
    </SharedLayout>
  );
}
