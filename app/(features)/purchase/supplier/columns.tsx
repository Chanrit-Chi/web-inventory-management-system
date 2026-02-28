"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  ViewSupplierDialog,
  UpdateSupplierDialog,
  DeleteSupplierDialog,
} from "./supplier-dialogs";
import { usePermission } from "@/hooks/usePermission";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type SupplierRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: {
    purchaseOrders: number;
    products: number;
  };
};

function ActionsCell({ supplier }: { readonly supplier: SupplierRow }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { can } = usePermission();

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => setViewOpen(true)}
          title="View Supplier"
        >
          <Eye className="h-4 w-4 text-sky-600" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                disabled={!can("supplier:update")}
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={
                  can("supplier:update") ? () => setEditOpen(true) : undefined
                }
                title="Edit Supplier"
              >
                <Pencil className="h-4 w-4 text-amber-600" />
              </Button>
            </span>
          </TooltipTrigger>
          {!can("supplier:update") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                disabled={!can("supplier:delete")}
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={
                  can("supplier:delete") ? () => setDeleteOpen(true) : undefined
                }
                title="Delete Supplier"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </span>
          </TooltipTrigger>
          {!can("supplier:delete") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
      </div>

      <ViewSupplierDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        supplier={supplier}
      />
      <UpdateSupplierDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        supplier={supplier}
      />
      <DeleteSupplierDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        supplier={supplier}
      />
    </>
  );
}

export const columns: ColumnDef<SupplierRow>[] = [
  {
    accessorKey: "index",
    header: "No",
    cell: ({ row }) => <div className="px-2">{row.index + 1}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="px-4 font-medium">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="px-4">{row.original.email}</div>,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <div className="px-4">{row.original.phone}</div>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <div className="px-4 max-w-[200px] truncate">{row.original.address}</div>
    ),
  },
  {
    id: "purchaseOrders",
    header: "Orders",
    cell: ({ row }) => (
      <div className="px-4 text-center">
        {row.original._count.purchaseOrders}
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
        Joined
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
    cell: ({ row }) => <ActionsCell supplier={row.original} />,
  },
];
