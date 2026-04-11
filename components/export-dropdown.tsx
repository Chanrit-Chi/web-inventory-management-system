"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CalendarDays,
  Loader2,
  Check,
} from "lucide-react";
import { useState, useCallback } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

type DatePreset = "all" | "today" | "7days" | "30days" | "thisMonth" | "custom";

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "thisMonth", label: "This Month" },
];

function getDateRange(preset: DatePreset): {
  startDate?: string;
  endDate?: string;
} {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  switch (preset) {
    case "all":
      return {};
    case "today":
      return { startDate: todayStr, endDate: todayStr };
    case "7days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { startDate: format(d, "yyyy-MM-dd"), endDate: todayStr };
    }
    case "30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return { startDate: format(d, "yyyy-MM-dd"), endDate: todayStr };
    }
    case "thisMonth": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: format(first, "yyyy-MM-dd"), endDate: todayStr };
    }
    default:
      return {};
  }
}

export interface ExportDateFilters {
  startDate?: string;
  endDate?: string;
}

interface ExportDropdownProps {
  /** Called when user clicks "Export as XLSX". Date filters included if showDateRange is true. */
  readonly onXlsxExport: (dateFilters: ExportDateFilters) => Promise<void>;
  /** Called when user clicks "Export as PDF Report". Date filters included if showDateRange is true. */
  readonly onPdfExport: (dateFilters: ExportDateFilters) => Promise<void>;
  /** Whether to show the date range picker section. Default: false */
  readonly showDateRange?: boolean;
  /** Whether the entire export dropdown is disabled (e.g. no permission). Default: false */
  readonly disabled?: boolean;
}

export function ExportDropdown({
  onXlsxExport,
  onPdfExport,
  showDateRange = false,
  disabled = false,
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  // Pending range used inside the dialog before confirming
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const getDateFilters = useCallback((): ExportDateFilters => {
    if (!showDateRange) return {};

    if (selectedPreset === "custom" && customRange?.from) {
      const filters: ExportDateFilters = {
        startDate: format(customRange.from, "yyyy-MM-dd"),
      };
      if (customRange.to) {
        filters.endDate = format(customRange.to, "yyyy-MM-dd");
      }
      return filters;
    }

    if (selectedPreset !== "all") {
      return getDateRange(selectedPreset);
    }

    return {};
  }, [showDateRange, selectedPreset, customRange]);

  const getDateLabel = useCallback((): string => {
    if (selectedPreset === "custom" && customRange?.from) {
      const fromStr = format(customRange.from, "MMM dd");
      const toStr = customRange.to ? format(customRange.to, "MMM dd") : fromStr;
      return `${fromStr} – ${toStr}`;
    }
    return (
      DATE_PRESETS.find((p) => p.value === selectedPreset)?.label || "All Time"
    );
  }, [selectedPreset, customRange]);

  const handleExport = async (
    exportFn: (dateFilters: ExportDateFilters) => Promise<void>,
  ) => {
    setIsExporting(true);
    try {
      await exportFn(getDateFilters());
    } finally {
      setIsExporting(false);
    }
  };

  const openCalendarDialog = () => {
    // Seed the pending range with the existing custom range so user can see previous selection
    setPendingRange(customRange);
    setCalendarOpen(true);
  };

  const confirmCustomRange = () => {
    if (pendingRange?.from) {
      setCustomRange(pendingRange);
      setSelectedPreset("custom");
    }
    setCalendarOpen(false);
  };

  const cancelCustomRange = () => {
    setPendingRange(undefined);
    setCalendarOpen(false);
  };

  // If disabled due to permissions, return a disabled button with tooltip
  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              className="btn btn-primary gap-2"
              disabled
              style={{ pointerEvents: "none" }}
            >
              <Upload className="size-4" />
              Export
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>No Permission</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      {/* Calendar Dialog — completely outside the DropdownMenu tree */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="w-auto max-w-fit sm:max-w-fit p-6" showCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Select Custom Date Range
            </DialogTitle>
          </DialogHeader>

          <div className="rounded-xl bg-background shadow-sm p-2">
            <Calendar
              mode="range"
              selected={pendingRange}
              onSelect={setPendingRange}
              numberOfMonths={2}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelCustomRange}>
              Cancel
            </Button>
            <Button
              onClick={confirmCustomRange}
              disabled={!pendingRange?.from}
            >
              Apply Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="btn btn-primary gap-2 w-full sm:w-auto"
            disabled={disabled || isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {showDateRange && (
            <>
              <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Date Range
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {DATE_PRESETS.map((preset) => (
                  <DropdownMenuItem
                    key={preset.value}
                    onSelect={() => {
                      setSelectedPreset(preset.value);
                      setCustomRange(undefined);
                    }}
                    className="text-sm"
                  >
                    <span className="flex items-center gap-2 w-full">
                      {selectedPreset === preset.value ? (
                        <Check className="size-3.5 text-primary" />
                      ) : (
                        <span className="w-3.5" />
                      )}
                      {preset.label}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    openCalendarDialog();
                  }}
                  className="text-sm"
                >
                  <span className="flex items-center gap-2 w-full">
                    {selectedPreset === "custom" ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                    {selectedPreset === "custom" && customRange?.from
                      ? `Custom: ${getDateLabel()}`
                      : "Custom Range..."}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuLabel className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Upload className="size-3.5" />
            Export Format
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleExport(onXlsxExport)}
            disabled={isExporting}
          >
            <FileSpreadsheet className="size-4 mr-2" />
            Export as XLSX
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExport(onPdfExport)}
            disabled={isExporting}
          >
            <FileText className="size-4 mr-2" />
            Export as PDF Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
