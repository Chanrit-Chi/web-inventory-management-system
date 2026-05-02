"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  SquarePen,
  AlertTriangle,
  TrendingDown,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { Badge } from "@/components/ui/badge";
import {
  ProductWithVariants,
  ViewProductDialog,
} from "../../products/product-list/product-dialogs";

function ActionsCell({ product }: { readonly product: ProductWithVariants }) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const { can } = usePermission();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setViewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            disabled={!can("product:update")}
            onClick={() => router.push(`/products/edit/${product.id}`)}
          >
            <SquarePen className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Edit Product
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push("/stock/adjust")}
          >
            <TrendingDown className="mr-2 h-4 w-4 text-orange-600" />
            Adjust Stock
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewProductDialog
        product={product}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
    </>
  );
}

export const columns: ColumnDef<ProductWithVariants>[] = [
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-2"
      >
        SKU
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="px-2 font-mono text-xs">{row.getValue("sku")}</div>,
    size: 100,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-2"
      >
        Product
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-2 px-2">
          {product.image ? (
            <Image
              width={32}
              height={32}
              src={product.image}
              alt={product.name}
              className="w-8 h-8 rounded object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
              <ShoppingBag className="size-4 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm font-medium truncate max-w-[200px]" title={product.name}>
            {product.name}
          </span>
        </div>
      );
    },
    size: 250,
  },
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => <div className="px-2 text-sm text-muted-foreground">{row.original.category?.name || "—"}</div>,
    size: 120,
  },
  {
    id: "stock_status",
    header: "Stock Status",
    cell: ({ row }) => {
      const variants = row.original.variants || [];
      const activeVariants = variants.filter(v => v.isActive);
      const totalStock = activeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      
      const isOutOfStock = activeVariants.length > 0 && activeVariants.every(v => v.stock === 0);
      const isLowStock = !isOutOfStock && activeVariants.some(v => v.stock < 10);

      if (isOutOfStock) {
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 px-2 py-0.5">
            <TrendingDown className="size-3" />
            Out of Stock
          </Badge>
        );
      }
      
      if (isLowStock) {
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 px-2 py-0.5">
            <AlertTriangle className="size-3" />
            Low Stock
          </Badge>
        );
      }

      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5">In Stock</Badge>;
    },
    size: 130,
  },
  {
    id: "quantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-2"
      >
        Current Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const variants = row.original.variants || [];
      const activeVariants = variants.filter(v => v.isActive);
      const totalStock = activeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      
      return (
        <div className="px-2 font-bold">
          {totalStock} <span className="text-xs font-normal text-muted-foreground">{row.original.unit}</span>
        </div>
      );
    },
    size: 120,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell product={row.original} />,
    size: 70,
  },
];
