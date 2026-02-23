"use client";

import { useGetQuotations } from "@/hooks/useQuotation";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { FileText, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function Quotations() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const {
    data: quotations,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetQuotations(page, limit, search, filters);

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
      <div className="flex gap-2 items-center">
        <FileText className="size-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Quotations</h1>
      </div>
      <div className="flex justify-end items-center gap-2">
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
        data={quotations?.data ?? []}
        showAddNew={true}
        addNewLabel="New Quotation"
        addNewHref="/sales/new-quotation"
        paginationMeta={quotations?.pagination}
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
              { value: "ACCEPTED", label: "Accepted" },
              { value: "REJECTED", label: "Rejected" },
              { value: "EXPIRED", label: "Expired" },
              { value: "CONVERTED", label: "Converted" },
            ],
          },
        ]}
      />
    </div>
  );
}

export default function QuotationPage() {
  return (
    <SharedLayout>
      <Quotations />
    </SharedLayout>
  );
}
