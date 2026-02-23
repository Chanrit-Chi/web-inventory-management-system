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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ColumnFilter {
  columnId: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<TData, TValue> {
  readonly columns: ColumnDef<TData, TValue>[];
  readonly data: TData[];
  readonly searchPlaceholder?: string;
  readonly searchKey?: string;
  readonly showAddNew?: boolean;
  readonly addNewLabel?: string;
  readonly onAddNew?: () => void;
  readonly addNewHref?: string;
  readonly showSearch?: boolean;
  readonly showPagination?: boolean;
  // Server-side pagination
  readonly paginationMeta?: PaginationMeta;
  readonly onPageChange?: (page: number) => void;
  readonly onPageSizeChange?: (pageSize: number) => void;
  // Row filters - filter rows based on column values
  readonly rowFilters?: ColumnFilter[];
  // Server-side search and filtering
  readonly onSearchChange?: (search: string) => void;
  readonly onFilterChange?: (filters: Record<string, string>) => void;
  readonly searchValue?: string;
  readonly filterValues?: Record<string, string>;
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
  paginationMeta,
  onPageChange,
  onPageSizeChange,
  rowFilters: filterConfigs = [],
  onSearchChange,
  onFilterChange,
  searchValue,
  filterValues = {},
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchInput, setSearchInput] = useState(searchValue || "");

  const isServerSidePagination = !!paginationMeta;

  // Sync search input with parent state
  useEffect(() => {
    setSearchInput(searchValue || "");
  }, [searchValue]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSidePagination
      ? undefined
      : getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: isServerSidePagination
      ? undefined
      : getFilteredRowModel(),
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
    ...(isServerSidePagination && {
      manualPagination: true,
      manualFiltering: true,
      pageCount: paginationMeta.totalPages,
    }),
  });

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    } else if (addNewHref) {
      globalThis.location.href = addNewHref;
    }
  };

  const handleFilterChange = (columnId: string, value: string) => {
    if (value === "all") {
      setColumnFilters((prev) => prev.filter((f) => f.id !== columnId));
    } else {
      setColumnFilters((prev) => {
        const existing = prev.filter((f) => f.id !== columnId);
        return [...existing, { id: columnId, value }];
      });
    }

    // Notify parent for server-side filtering
    if (isServerSidePagination && onFilterChange) {
      const newFilters =
        value === "all"
          ? columnFilters.filter((f) => f.id !== columnId)
          : [
              ...columnFilters.filter((f) => f.id !== columnId),
              { id: columnId, value },
            ];

      const filterObj = newFilters.reduce(
        (acc, f) => {
          acc[f.id] = f.value as string;
          return acc;
        },
        {} as Record<string, string>,
      );

      onFilterChange(filterObj);
    }
  };

  const handleSearchChange = (value: string) => {
    setGlobalFilter(value);

    // Notify parent for server-side search
    if (isServerSidePagination && onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleSearchClick = () => {
    handleSearchChange(searchInput);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchChange(searchInput);
    }
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setGlobalFilter("");
    setColumnFilters([]);

    // Notify parent to clear server-side filters
    if (isServerSidePagination) {
      if (onSearchChange) {
        onSearchChange("");
      }
      if (onFilterChange) {
        onFilterChange({});
      }
    }
  };

  const hasActiveFilters = searchInput || Object.keys(filterValues).length > 0;

  return (
    <div className="w-full h-full flex flex-col" style={{ minHeight: 0 }}>
      {(showSearch || showAddNew || filterConfigs.length > 0) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center py-2 gap-2 mb-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            {showSearch && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder={searchPlaceholder}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="flex-1 sm:max-w-sm"
                />
                <Button
                  onClick={handleSearchClick}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {filterConfigs.map((filter) => (
                <Select
                  key={filter.columnId}
                  value={filterValues[filter.columnId] || "all"}
                  onValueChange={(value) =>
                    handleFilterChange(filter.columnId, value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.label}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {showAddNew && (
            <Button
              onClick={handleAddNew}
              className="cursor-pointer w-full sm:w-auto sm:ml-auto"
            >
              {addNewLabel}
            </Button>
          )}
        </div>
      )}

      <div
        className="flex-1 min-h-0 overflow-x-auto rounded-md border"
        style={{ overflowY: "auto", maxHeight: "65vh" }}
      >
        <Table className="w-full">
          <TableHeader className="bg-primary/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-primary/15">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="font-semibold text-xs px-2"
                      style={{
                        width: header.column.columnDef.size
                          ? `${header.column.columnDef.size}px`
                          : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                  className="h-8"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-1 px-2"
                      style={{
                        width: cell.column.columnDef.size
                          ? `${cell.column.columnDef.size}px`
                          : undefined,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className={undefined}>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center text-sm"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2 mt-1 sticky bottom-0 bg-background border-t">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            {isServerSidePagination ? (
              <>
                Showing {(paginationMeta.page - 1) * paginationMeta.limit + 1}{" "}
                to{" "}
                {Math.min(
                  paginationMeta.page * paginationMeta.limit,
                  paginationMeta.total,
                )}{" "}
                of {paginationMeta.total} row(s)
              </>
            ) : (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {isServerSidePagination && (
              <span className="text-sm text-muted-foreground">
                Page {paginationMeta.page} of {paginationMeta.totalPages}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isServerSidePagination && onPageChange) {
                    onPageChange(paginationMeta.page - 1);
                  } else {
                    table.previousPage();
                  }
                }}
                disabled={
                  isServerSidePagination
                    ? paginationMeta.page <= 1
                    : !table.getCanPreviousPage()
                }
                className="flex-1 sm:flex-none"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isServerSidePagination && onPageChange) {
                    onPageChange(paginationMeta.page + 1);
                  } else {
                    table.nextPage();
                  }
                }}
                disabled={
                  isServerSidePagination
                    ? paginationMeta.page >= paginationMeta.totalPages
                    : !table.getCanNextPage()
                }
                className="flex-1 sm:flex-none"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
