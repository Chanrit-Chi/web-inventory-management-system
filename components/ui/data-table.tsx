"use client";

import {
  ColumnDef,
  flexRender,
  ColumnFiltersState,
  getFilteredRowModel,
  SortingState,
  VisibilityState,
  getSortedRowModel,
  getPaginationRowModel,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: string;
  showAddNew?: boolean;
  addNewLabel?: string;
  onAddNew?: () => void;
  addNewHref?: string;
  showSearch?: boolean;
  showPagination?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey,
  showSearch = true,
  showAddNew = false,
  addNewLabel = "Add New",
  onAddNew,
  addNewHref,
  showPagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
    },
  });

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    } else if (addNewHref) {
      window.location.href = addNewHref;
    }
  };

  return (
    <div>
      {(showSearch || showAddNew) && (
        <div className="flex items-center py-4 justify-between">
          {showSearch && (
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="max-w-sm"
              type={undefined}
            />
          )}

          {showAddNew && (
            <Button
              onClick={handleAddNew}
              className="ml-auto"
              variant={undefined}
              size={undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              {addNewLabel}
            </Button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table className={undefined}>
          <TableHeader className={undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={undefined}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={undefined}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={undefined}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={undefined}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className={undefined}>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={undefined}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={undefined}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
