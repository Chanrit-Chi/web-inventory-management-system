"use client";

import { Expense } from "@/schemas/type-export.schema";
import { ViewDialog } from "@/components/dialog-template";

export function ViewExpenseDialog({
  expense,
  open,
  onOpenChange,
}: {
  readonly expense: Expense;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <ViewDialog<Expense>
      open={open}
      onOpenChange={onOpenChange}
      title="View Expense"
      description="Expense details"
      item={expense}
      fields={[
        {
          label: "Date",
          value: (e) => new Date(e.expenseDate).toLocaleDateString(),
        },
        {
          label: "Description",
          value: (e) => e.description,
        },
        {
          label: "Category",
          value: (e) => e.category?.name || "N/A",
        },
        {
          label: "Amount",
          value: (e) => `$${Number(e.amount).toFixed(2)}`,
        },
        {
          label: "Reference",
          value: (e) => e.referenceNo || "N/A",
        },
        {
          label: "Notes",
          value: (e) => e.notes || "N/A",
        },
      ]}
    />
  );
}
