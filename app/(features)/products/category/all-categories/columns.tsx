"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Category } from "@/schemas/type-export.schema";
import { useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ViewCategoryDialog,
  UpdateCategoryDialog,
  DeleteCategoryDialog,
} from "./category-dialogs";

function ActionsCell({ category }: { readonly category: Category }) {
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
                  can("category:update")
                    ? "cursor-pointer hover:text-green-600"
                    : "opacity-40 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  can("category:update") ? () => setUpdateOpen(true) : undefined
                }
              />
            </span>
          </TooltipTrigger>
          {!can("category:update") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex ml-4">
              <Trash2
                className={`size-5 transition-colors ${
                  can("category:delete")
                    ? "text-red-600 cursor-pointer hover:text-red-800"
                    : "text-red-300 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  can("category:delete") ? () => setDeleteOpen(true) : undefined
                }
              />
            </span>
          </TooltipTrigger>
          {!can("category:delete") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
      </div>

      <ViewCategoryDialog
        category={category}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <UpdateCategoryDialog
        category={category}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />
      <DeleteCategoryDialog
        category={category}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

export const columns: ColumnDef<Category>[] = [
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
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="px-3">{row.original.name}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Create Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div className="px-3">{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      return <div>{row.original.description}</div>;
    },
  },
  {
    header: () => <div className="text-center">Actions</div>,
    id: "actions",
    cell: ({ row }) => <ActionsCell category={row.original} />,
  },
];
