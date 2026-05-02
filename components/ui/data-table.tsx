"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "./date-range-picker";
import { parseISO } from "date-fns";

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
import { CircleX, Search } from "lucide-react";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  readonly showAddNew?: boolean;
  readonly addNewLabel?: string;
  readonly addNewDisabled?: boolean;
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
  readonly baseFilters?: Record<string, string>;
  readonly dateFilter?: {
    startDateKey?: string;
    endDateKey?: string;
    label?: string;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  showSearch = true,
  showAddNew = false,
  addNewLabel = "Add New",
  addNewDisabled = false,
  onAddNew,
  addNewHref,
  showPagination = true,
  paginationMeta,
  onPageChange,
  rowFilters: filterConfigs = [],
  onSearchChange,
  onFilterChange,
  searchValue,
  filterValues = {},
  baseFilters = {},
  dateFilter,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [searchInput, setSearchInput] = useState(searchValue || "");
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    undefined,
  );

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
      const newFilters = { ...filterValues };
      if (value === "all") {
        delete newFilters[columnId];
      } else {
        newFilters[columnId] = value;
      }
      onFilterChange(newFilters);
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
    setPendingRange(undefined);

    // Notify parent to clear server-side filters, but keep base filters
    if (isServerSidePagination) {
      if (onSearchChange) {
        onSearchChange("");
      }
      if (onFilterChange) {
        onFilterChange(baseFilters);
      }
    }
  };

  const getFilterValue = (columnId: string): string => {
    // For client-side filtering, get value from columnFilters state
    const columnFilter = columnFilters.find((f) => f.id === columnId);
    if (columnFilter) {
      return columnFilter.value as string;
    }
    // For server-side filtering, get value from filterValues prop
    return filterValues[columnId] || "all";
  };

  const currentRange: DateRange | undefined = React.useMemo(() => {
    if (!dateFilter) return undefined;
    const from = filterValues[dateFilter.startDateKey || "startDate"];
    const to = filterValues[dateFilter.endDateKey || "endDate"];

    return {
      from: from ? parseISO(from) : undefined,
      to: to ? parseISO(to) : undefined,
    };
  }, [filterValues, dateFilter]);

  // Sync pending range with current range from props
  useEffect(() => {
    // Only update if currentRange from props is different from pendingRange
    const isDifferent =
      currentRange?.from?.getTime() !== pendingRange?.from?.getTime() ||
      currentRange?.to?.getTime() !== pendingRange?.to?.getTime();

    if (!isDifferent) return;

    // If currentRange is present (complete), we should definitely sync it
    if (currentRange?.from && currentRange?.to) {
      setPendingRange(currentRange);
      return;
    }

    // If currentRange is empty, we only reset pendingRange if it was already complete
    // or if it was also empty. This prevents resetting partial selections (1 click)
    // when the parent re-renders before the 2nd click.
    if (!currentRange) {
      const isPendingPartial = pendingRange?.from && !pendingRange?.to;

      if (!isPendingPartial) {
        setPendingRange(undefined);
      }
    }
  }, [currentRange, pendingRange]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!dateFilter || !onFilterChange) return;

    setPendingRange(range);

    // ONLY apply if we have a full range (from AND to) OR it's being cleared (completely undefined)
    const isSelectionComplete = !!range?.from && !!range?.to;
    const isSelectionCleared = range === undefined;

    if (isSelectionComplete || isSelectionCleared) {
      const newFilters = { ...filterValues };
      const startKey = dateFilter.startDateKey || "startDate";
      const endKey = dateFilter.endDateKey || "endDate";

      if (range?.from) {
        newFilters[startKey] = range.from.toISOString();
      } else {
        delete newFilters[startKey];
      }

      if (range?.to) {
        newFilters[endKey] = range.to.toISOString();
      } else {
        delete newFilters[endKey];
      }

      onFilterChange(newFilters);
    }
  };

  const hasActiveFilters =
    searchInput ||
    columnFilters.length > 0 ||
    Object.keys(filterValues).some(
      (key) => filterValues[key] !== baseFilters[key],
    );

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
                  className="shrink-0 bg-transparent"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {filterConfigs.map((filter) => (
                <Select
                  key={filter.columnId}
                  value={getFilterValue(filter.columnId)}
                  onValueChange={(value) =>
                    handleFilterChange(filter.columnId, value)
                  }
                >
                  <SelectTrigger className="w-full sm:w-45">
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

              {dateFilter && (
                <DatePickerWithRange
                  date={pendingRange}
                  onDateChange={handleDateRangeChange}
                  placeholder={dateFilter.label}
                  className="w-full sm:w-auto"
                />
              )}

              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  variant="ghost"
                  size="sm"
                  className="h-9 border border-primary px-2 sm:px-3 w-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Clear all filters"
                >
                  <CircleX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {showAddNew && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex w-full sm:w-auto sm:ml-auto">
                  <Button
                    onClick={addNewDisabled ? undefined : handleAddNew}
                    disabled={addNewDisabled}
                    className="cursor-pointer w-full sm:w-auto"
                  >
                    {addNewLabel}
                  </Button>
                </span>
              </TooltipTrigger>
              {addNewDisabled && <TooltipContent>No permission</TooltipContent>}
            </Tooltip>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2 mt-1 sticky bottom-0 border rounded-lg backdrop-blur-md">
          <div className="text-sm text-muted-foreground text-center sm:text-left p-2">
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
                className="flex-1 sm:flex-none mr-2"
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
