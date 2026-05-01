"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Circle, CheckCircle2 } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  readonly className?: string;
  readonly date?: DateRange;
  readonly onDateChange?: (date: DateRange | undefined) => void;
  readonly placeholder?: string;
}

const PRESETS = [
  { name: "Today", getValue: (): DateRange => ({ from: startOfDay(new Date()), to: startOfDay(new Date()) }) },
  { name: "Yesterday", getValue: (): DateRange => ({ from: startOfDay(subDays(new Date(), 1)), to: startOfDay(subDays(new Date(), 1)) }) },
  { name: "Last 7 Days", getValue: (): DateRange => ({ from: startOfDay(subDays(new Date(), 6)), to: startOfDay(new Date()) }) },
  { name: "Last 30 Days", getValue: (): DateRange => ({ from: startOfDay(subDays(new Date(), 29)), to: startOfDay(new Date()) }) },
  { name: "This Month", getValue: (): DateRange => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { name: "Last Month", getValue: (): DateRange => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    } 
  },
];

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
  placeholder = "Pick a date",
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date);

  // Sync internal state with external state when popover opens or date changes
  React.useEffect(() => {
    setInternalDate(date);
  }, [date, isOpen]);

  const dateDisplay = React.useMemo(() => {
    if (!date?.from) return <span>{placeholder}</span>;
    if (date.to) {
      if (isSameDay(date.from, date.to)) {
        return format(date.from, "LLL dd, y");
      }
      return (
        <>
          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
        </>
      );
    }
    return format(date.from, "LLL dd, y");
  }, [date, placeholder]);

  const handleUpdate = () => {
    if (internalDate?.from && !internalDate.to) {
      // If only one day is selected, assume it's a single day range
      onDateChange?.({ from: internalDate.from, to: internalDate.from });
    } else {
      onDateChange?.(internalDate);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setInternalDate(date);
    setIsOpen(false);
  };

  const isPresetActive = React.useCallback((presetValue: DateRange) => {
    if (!internalDate?.from) return false;
    const sameFrom = isSameDay(internalDate.from, presetValue.from!);
    
    // If internalDate.to is undefined, assume it's the same as internalDate.from for single-day checks
    const currentTo = internalDate.to || internalDate.from;
    const sameTo = isSameDay(currentTo, presetValue.to || presetValue.from!);
    
    return sameFrom && sameTo;
  }, [internalDate]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker-range"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal px-2.5 bg-transparent",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateDisplay}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-border border-b">
            {/* Presets Sidebar */}
            <div className="flex flex-col gap-1 p-3 w-full md:w-40 bg-muted/20">
              {PRESETS.map((preset) => {
                const presetValue = preset.getValue();
                const isActive = isPresetActive(presetValue);
                
                return (
                  <Button
                    key={preset.name}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-start font-normal h-8",
                      isActive && "bg-muted text-primary font-medium"
                    )}
                    onClick={() => setInternalDate(presetValue)}
                  >
                    {isActive ? (
                      <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    {preset.name}
                  </Button>
                );
              })}
            </div>
            
            {/* Calendar */}
            <div className="p-1">
              <Calendar
                mode="range"
                defaultMonth={internalDate?.from || new Date()}
                selected={internalDate}
                onSelect={setInternalDate}
                numberOfMonths={2}
              />
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 p-3 bg-muted/10">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate}>
              Update
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
