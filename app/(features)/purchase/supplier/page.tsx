"use client";

import { useState } from "react";
import { SharedLayout } from "@/components/shared-layout";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Truck } from "lucide-react";
import { useGetSuppliers } from "@/hooks/useSupplier";
import { columns } from "./columns";
import { CreateSupplierDialog } from "./supplier-dialogs";

function SupplierList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: suppliers,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetSuppliers(page, limit, search);

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
        <Truck className="size-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Suppliers</h1>
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
        data={suppliers?.data ?? []}
        showAddNew
        addNewLabel="New Supplier"
        onAddNew={() => setCreateOpen(true)}
        paginationMeta={suppliers?.pagination}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchValue={search}
        searchPlaceholder="Search by name, email, or phone..."
      />

      <CreateSupplierDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

export default function SupplierPage() {
  return (
    <SharedLayout>
      <SupplierList />
    </SharedLayout>
  );
}
