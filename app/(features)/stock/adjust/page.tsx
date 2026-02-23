"use client";

import { useState } from "react";
import { SharedLayout } from "@/components/shared-layout";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { useGetStockMovements } from "@/hooks/useStock";
import { Spinner } from "@/components/ui/spinner";
import { RefreshCcw, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockMovementType } from "@prisma/client";
import { StockAdjustmentDialog } from "./adjust-dialogs";
import { BatchStockAdjustmentDialog } from "./batch-dialogs";

function StockAdjustment() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  const {
    data: movements,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetStockMovements(
    page,
    limit,
    search,
    filters.movementType as StockMovementType,
  );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex gap-2 items-center">
          <Warehouse className="size-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Stock Adjustment History</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => refetch()}
            disabled={isFetching}
            variant="outline"
            size="icon"
          >
            {isFetching ? (
              <Spinner className="size-4" />
            ) : (
              <RefreshCcw className="size-4" />
            )}
          </Button>
          <Button
            onClick={() => setIsBatchDialogOpen(true)}
            variant="outline"
            className="flex-1 sm:flex-none border-primary text-primary hover:bg-primary/5"
          >
            Batch Adjust
          </Button>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex-1 sm:flex-none"
          >
            Adjust Stock
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={movements?.data ?? []}
        showAddNew={false}
        paginationMeta={movements?.pagination}
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
            columnId: "movementType",
            label: "Type",
            options: [
              { value: "ADJUSTMENT", label: "Adjustment" },
              { value: "DAMAGE", label: "Damage" },
              { value: "RETURN", label: "Return" },
              { value: "INITIAL", label: "Initial" },
              { value: "SALE", label: "Sale" },
              { value: "PURCHASE", label: "Purchase" },
            ],
          },
        ]}
      />

      <StockAdjustmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <BatchStockAdjustmentDialog
        open={isBatchDialogOpen}
        onOpenChange={setIsBatchDialogOpen}
      />
    </div>
  );
}

export default function StockAdjustmentPage() {
  return (
    <SharedLayout>
      <StockAdjustment />
    </SharedLayout>
  );
}
