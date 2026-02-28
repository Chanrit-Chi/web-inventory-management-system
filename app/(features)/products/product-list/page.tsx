"use client";

import { SharedLayout } from "@/components/shared-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  RefreshCcw,
  LayoutGrid,
  List,
  ShoppingBag,
  Edit,
  Eye,
} from "lucide-react";
import { columns } from "./columns";
import { useState, useMemo } from "react";
import { useGetProducts } from "@/hooks/useProduct";
import { usePermission } from "@/hooks/usePermission";
import { useGetCategories } from "@/hooks/useCategory";
import {
  ProductWithVariants,
  ViewProductDialog,
  DeleteProductDialog,
  ReactivateProductDialog,
} from "./product-dialogs";
import Image from "next/image";
import Link from "next/link";

type ViewMode = "table" | "grid";

function ProductCard({ product }: { readonly product: ProductWithVariants }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const totalStock =
    product.variants?.reduce((sum: number, v) => sum + (v.stock || 0), 0) ?? 0;
  const price = product.variants?.[0]?.sellingPrice;
  const formattedPrice =
    price == null
      ? null
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Number(price));

  const isActive = product.isActive === "ACTIVE";

  return (
    <>
      <div className="bg-card border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <ShoppingBag className="size-12 text-muted-foreground/40" />
          )}
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className={
                isActive
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300"
              }
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          <p className="font-semibold text-sm truncate" title={product.name}>
            {product.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {product.category?.name ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>

          <div className="flex items-center justify-between mt-auto pt-2">
            <div>
              {formattedPrice && (
                <p className="text-sm font-bold">{formattedPrice}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Stock: {totalStock} {product.unit ?? ""}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t flex divide-x">
          <button
            onClick={() => setViewOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Eye className="size-3.5" />
            View
          </button>
          <Link
            href={`/products/edit/${product.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Edit className="size-3.5" />
            Edit
          </Link>
          <button
            onClick={() => setDeleteOpen(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs transition-colors cursor-pointer hover:bg-muted ${
              isActive
                ? "text-red-500 hover:text-red-600"
                : "text-green-500 hover:text-green-600"
            }`}
          >
            {isActive ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>

      <ViewProductDialog
        product={product}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      {isActive ? (
        <DeleteProductDialog
          product={product}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      ) : (
        <ReactivateProductDialog
          product={product}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}

// ── Product Grid ───────────────────────────────────────────────────────────

function ProductGrid({
  products,
}: {
  readonly products: ProductWithVariants[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 py-2">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

function ProductList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const { can } = usePermission();

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
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1);
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

        {/* View mode toggle */}
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            className="rounded-none border-0 px-2.5"
            onClick={() => setViewMode("table")}
            title="Table view"
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className="rounded-none border-0 px-2.5"
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {viewMode === "table" ? (
          <DataTable
            columns={columns}
            data={products?.data ?? []}
            showAddNew={true}
            addNewDisabled={!can("product:create")}
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
        ) : (
          <ProductGrid
            products={(products?.data ?? []) as ProductWithVariants[]}
          />
        )}
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
