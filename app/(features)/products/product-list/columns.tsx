"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
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
import {
  ProductWithVariants,
  ViewProductDialog,
  DeleteProductDialog,
  ReactivateProductDialog,
} from "./product-dialogs";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Actions Cell Component (needs hooks, so separate from column definition)
function ActionsCell({ product }: { readonly product: ProductWithVariants }) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" size={undefined}>
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
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => router.push(`/products/edit/${product.id}`)}
          >
            Edit Product
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={`cursor-pointer ${product.isActive === "ACTIVE" ? "text-red-600" : "text-green-600"}`}
            onClick={() => setDeleteOpen(true)}
          >
            {product.isActive === "ACTIVE"
              ? "Deactivate Product"
              : "Reactivate Product"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ViewProductDialog
        product={product}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />

      {product.isActive === "ACTIVE" ? (
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

export const columns: ColumnDef<ProductWithVariants>[] = [
  {
    accessorKey: "index",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-center">{row.index + 1}</div>;
    },
    size: 60,
  },
  {
    accessorKey: "sku",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SKU
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="px-2 text-sm max-w-[100px] truncate">
          {row.getValue("sku")}
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-2">
          {product.image ? (
            <Image
              width={40}
              height={40}
              src={product.image}
              alt={product.name}
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-gray-500">img</span>
            </div>
          )}
          <span className="text-sm truncate max-w-[150px]" title={product.name}>
            {product.name}
          </span>
        </div>
      );
    },
    size: 200,
  },
  {
    accessorKey: "category.name",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div
          className="px-2 text-sm max-w-[120px] truncate"
          title={row.original.category?.name}
        >
          {row.original.category?.name}
        </div>
      );
    },
    size: 120,
  },
  {
    id: "sellingPrice",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const variants = row.original.variants;
      if (!variants || variants.length === 0)
        return <div className="px-2 text-sm">N/A</div>;

      const price = variants[0].sellingPrice;
      const amount = Number.parseFloat(price.toString());
      return (
        <div className="px-2 text-sm">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(amount)}
        </div>
      );
    },
    size: 100,
  },
  {
    id: "unit",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Unit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="px-2 text-sm text-center">
          {row.original.unit || "-"}
        </div>
      );
    },
    size: 80,
  },
  {
    id: "quantity",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const variants = row.original.variants;
      if (!variants || variants.length === 0)
        return <div className="px-2 text-sm text-center">0</div>;

      // Sum up stock from all variants
      const totalStock = variants.reduce(
        (sum: number, v) => sum + (v.stock || 0),
        0,
      );
      return (
        <div className="px-2 text-sm text-center">
          {totalStock}{" "}
          <span className="text-xs text-muted-foreground">
            {row.original.unit}
          </span>
        </div>
      );
    },
    size: 100,
  },

  {
    accessorKey: "isActive",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isActive: string = row.getValue("isActive");
      let statusClass = "";
      if (isActive == "ACTIVE") {
        statusClass =
          "text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded text-xs";
      } else {
        statusClass =
          "text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded text-xs";
      }
      return (
        <div className="px-2">
          <span className={statusClass}>
            {isActive == "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>
      );
    },
    size: 90,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div className="px-2 text-sm">{date.toLocaleDateString()}</div>;
    },
    size: 100,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      return <ActionsCell product={product} />;
    },
    size: 70,
  },
];
