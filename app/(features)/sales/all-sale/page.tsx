"use client";

import { useSale } from "@/hooks/useSale";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

function Sale() {
  const { data: sales, isLoading, isFetching, error, refetch } = useSale();

  if (isLoading)
    return (
      <div className="items-center justify-center flex min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto py-10">
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
        data={sales ?? []}
        showAddNew={true}
        addNewLabel="New Sale"
        addNewHref="/sales/new-sale"
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
