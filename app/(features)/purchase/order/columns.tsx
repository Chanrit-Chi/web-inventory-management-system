"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ViewPurchaseOrderDialog,
  DeletePurchaseOrderDialog,
} from "./purchase-order-dialogs";
import { usePermission } from "@/hooks/usePermission";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/StatusBadge";

export type PurchaseOrderDetailRow = {
  id: number;
  productId: string;
  variantId: number;
  quantity: number;
  unitPrice: number;
  product: { name: string; sku: string; image: string | null };
  variant: {
    id: number;
    sku: string;
    stock: number;
    attributes: Array<{
      value: {
        value: string;
        attribute: { name: string };
      };
    }>;
  };
};

export type PurchaseOrderRow = {
  id: number;
  supplierId: string;
  status: string;
  totalAmount: string | number;
  createdAt: Date | string;
  updatedAt: Date | string;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  purchaseOrderDetails: PurchaseOrderDetailRow[];
};

function ActionsCell({ order }: { readonly order: PurchaseOrderRow }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const { can } = usePermission();

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          onClick={() => setViewOpen(true)}
          title="View Purchase Order"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => router.push(`/purchase/edit-order/${order.id}`)}
                title={
                  order.status === "COMPLETED"
                    ? "Completed orders cannot be edited"
                    : "Edit Purchase Order"
                }
                disabled={
                  order.status === "COMPLETED" || !can("purchase_order:update")
                }
              >
                <SquarePen className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          {!can("purchase_order:update") && order.status !== "COMPLETED" && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                disabled={!can("purchase_order:delete")}
                className="h-8 w-8 p-0 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={
                  can("purchase_order:delete")
                    ? () => setDeleteOpen(true)
                    : undefined
                }
                title="Delete Purchase Order"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          {!can("purchase_order:delete") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
      </div>

      <ViewPurchaseOrderDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        order={order}
      />
      <DeletePurchaseOrderDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        order={order}
      />
    </>
  );
}

export const columns: ColumnDef<PurchaseOrderRow>[] = [
  {
    accessorKey: "index",
    header: "No",
    cell: ({ row }) => <div className="px-2">{row.index + 1}</div>,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        PO No
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="px-4 font-mono">
        PO-{String(row.original.id).padStart(4, "0")}
      </div>
    ),
  },
  {
    id: "supplier.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Supplier
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="px-4">{row.original.supplier?.name}</div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => {
      const amount = Number(row.original.totalAmount);
      return (
        <div className="px-4">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(amount)}
        </div>
      );
    },
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => (
      <div className="px-4 text-center">
        {row.original.purchaseOrderDetails.length}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div className="px-4">{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell order={row.original} />,
  },
];
