"use client";

import { SharedLayout } from "@/components/shared-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { Download, RefreshCcw } from "lucide-react";
import { columns } from "./columns";
import { useState, useMemo } from "react";
import { useGetProducts } from "@/hooks/useProduct";
import { useGetCategories } from "@/hooks/useCategory";

function ProductList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const {
    data: products,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetProducts(page, limit, search, filters);

  const { data: categories, isLoading: isLoadingCategories } =
    useGetCategories();

  const categoryOptions = useMemo(
    () =>
      categories?.map((cat) => ({
        value: cat.id.toString(),
        label: cat.name,
      })) ?? [],
    [categories],
  );

  if (isLoading || isLoadingCategories)
    return (
      <div className="items-center justify-center flex min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );

  if (error) return <div>Error: {error.message}</div>;

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  return (
    <div className="w-full min-h-full flex flex-col px-2 py-2 overflow-hidden">
      <h1 className="text-xl font-bold mb-1">Product List</h1>
      <div className="flex justify-end items-center gap-2 mb-1">
        <Button className="btn btn-primary">XLSX</Button>
        <Button className="btn btn-primary">
          <Download className="size-4" />
          Import
        </Button>
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
      <div className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={products?.data ?? []}
          showAddNew={true}
          addNewLabel="New Product"
          addNewHref="/products/new"
          paginationMeta={products?.pagination}
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
              columnId: "isActive",
              label: "Status",
              options: [
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ],
            },
            {
              columnId: "category",
              label: "Category",
              options: categoryOptions,
            },
          ]}
        />
      </div>
    </div>
  );
}

export default function Product() {
  return (
    <SharedLayout>
      <ProductList />
    </SharedLayout>
  );
}
