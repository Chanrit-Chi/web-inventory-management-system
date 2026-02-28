"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Unit } from "@/schemas/type-export.schema";
import { useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DeleteUnitDialog,
  UpdateUnitDialog,
  ViewUnitDialog,
} from "./unit-dialogs";

function ActionsCell({ unit }: { readonly unit: Unit }) {
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
                  can("unit:update")
                    ? "cursor-pointer hover:text-green-600"
                    : "opacity-40 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  can("unit:update") ? () => setUpdateOpen(true) : undefined
                }
              />
            </span>
          </TooltipTrigger>
          {!can("unit:update") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex ml-4">
              <Trash2
                className={`size-5 transition-colors ${
                  can("unit:delete")
                    ? "text-red-600 cursor-pointer hover:text-red-800"
                    : "text-red-300 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  can("unit:delete") ? () => setDeleteOpen(true) : undefined
                }
              />
            </span>
          </TooltipTrigger>
          {!can("unit:delete") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>
      </div>

      <ViewUnitDialog unit={unit} open={viewOpen} onOpenChange={setViewOpen} />
      <UpdateUnitDialog
        unit={unit}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />
      <DeleteUnitDialog
        unit={unit}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

export const columns: ColumnDef<Unit>[] = [
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
          Unit
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
    cell: ({ row }) => <ActionsCell unit={row.original} />,
  },
];
