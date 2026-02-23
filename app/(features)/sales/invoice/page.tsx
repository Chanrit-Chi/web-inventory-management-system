"use client";

import { useGetInvoices } from "@/hooks/useInvoice";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { Receipt, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function Invoices() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const {
    data: invoices,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetInvoices(page, limit, search, filters);

  if (isLoading)
    return (
      <div className="items-center justify-center flex min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );

  if (error) return <div>Error: {error.message}</div>;

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="w-full px-2 md:px-3 py-3">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 items-center">
          <Receipt className="size-6 text-emerald-500" />
          <h1 className="text-2xl font-bold">Invoices</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices?.data ?? []}
        showAddNew={false}
        paginationMeta={invoices?.pagination}
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
              { value: "DRAFT", label: "Draft" },
              { value: "SENT", label: "Sent" },
              { value: "PAID", label: "Paid" },
              { value: "OVERDUE", label: "Overdue" },
            ],
          },
        ]}
      />
    </div>
  );
}

export default function InvoicePage() {
  return (
    <SharedLayout>
      <Invoices />
    </SharedLayout>
  );
}
