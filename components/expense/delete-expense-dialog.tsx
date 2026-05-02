"use client";

import { toast } from "sonner";
import { Expense } from "@/schemas/type-export.schema";
import { ConfirmDialog } from "@/components/dialog-template";
import { useExpenseMutations } from "@/hooks/useExpense";

export function DeleteExpenseDialog({
  expense,
  open,
  onOpenChange,
}: {
  readonly expense: Expense;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { deleteExpense } = useExpenseMutations();

  const handleDelete = async () => {
    try {
      await deleteExpense.mutateAsync(expense.id);
      toast.success("Expense deleted successfully");
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete expense";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<Expense>
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Expense"
      description="Are you sure you want to delete this expense? This action cannot be undone."
      item={expense}
      renderItem={(e) => (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold">Description:</p>
          <p className="text-sm">{e.description}</p>
          <p className="text-sm font-semibold mt-2">Amount:</p>
          <p className="text-sm">${Number(e.amount).toFixed(2)}</p>
          <p className="text-sm font-semibold mt-2">Category:</p>
          <p className="text-sm">{e.category?.name || "N/A"}</p>
        </div>
      )}
      onConfirm={handleDelete}
      confirmLabel="Deleting"
      isLoading={deleteExpense.isPending}
    />
  );
}
