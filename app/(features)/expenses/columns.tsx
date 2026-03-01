"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Expense } from "@/schemas/type-export.schema";
import { useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ViewExpenseDialog,
  UpdateExpenseDialog,
  DeleteExpenseDialog,
} from "./expense-dialogs";

function ActionsCell({ expense }: { readonly expense: Expense }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { can } = usePermission();

  return (
    <>
      <div className="flex justify-center items-center">
        <Eye
          className="size-5 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setViewOpen(true)}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex ml-4">
              <SquarePen
                className={`size-5 transition-colors ${
                  can("expense:update")
                    ? "cursor-pointer hover:text-green-600"
                    : "opacity-40 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  can("expense:update") ? () => setUpdateOpen(true) : undefined
                }
              />
            </span>
          </TooltipTrigger>
          {!can("expense:update") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex ml-4">
              <Trash2
                className={`size-5 transition-colors ${
                  can("expense:delete")
                    ? "text-red-600 cursor-pointer hover:text-red-800"
                    : "text-red-300 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  can("expense:delete") ? () => setDeleteOpen(true) : undefined
                }
              />
            </span>
          </TooltipTrigger>
          {!can("expense:delete") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
      </div>

      <ViewExpenseDialog
        expense={expense}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <UpdateExpenseDialog
        expense={expense}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />
      <DeleteExpenseDialog
        expense={expense}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

export const columns: ColumnDef<Expense>[] = [
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
      return <div className="px-4">{row.index + 1}</div>;
    },
  },
  {
    accessorKey: "expenseDate",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.original.expenseDate);
      return <div className="px-3">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return (
        <div className="max-w-80 truncate">{row.original.description}</div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      return <div>{row.original.category?.name || "N/A"}</div>;
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="font-semibold">
          ${Number(row.original.amount).toFixed(2)}
        </div>
      );
    },
  },
  {
    header: () => <div className="text-center">Actions</div>,
    id: "actions",
    cell: ({ row }) => <ActionsCell expense={row.original} />,
  },
];
