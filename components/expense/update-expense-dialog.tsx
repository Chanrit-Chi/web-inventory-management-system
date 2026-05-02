"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import {
  Expense,
  ExpenseCategory,
  ExpenseUpdate,
} from "@/schemas/type-export.schema";
import { BaseDialog } from "@/components/dialog-template";
import {
  useExpenseMutations,
  useGetExpenseById,
  useGetExpenseCategories,
} from "@/hooks/useExpense";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { StepperInput } from "@/components/ui/stepper-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateExpenseCategoryDialog } from "./create-expense-category-dialog";

export function UpdateExpenseDialog({
  expense,
  open,
  onOpenChange,
}: {
  readonly expense: Expense;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const [createdCategory, setCreatedCategory] =
    useState<ExpenseCategory | null>(null);
  const { updateExpense } = useExpenseMutations();
  const { data: categories } = useGetExpenseCategories();
  const { data: expenseData } = useGetExpenseById(expense.id);

  const categoryOptions = useMemo(() => {
    const base = categories || [];
    if (!createdCategory) return base;
    const exists = base.some((category) => category.id === createdCategory.id);
    return exists ? base : [createdCategory, ...base];
  }, [categories, createdCategory]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<ExpenseUpdate>({
    defaultValues: {
      description: expense.description,
      categoryId: expense.category?.id ?? null,
      categoryName: expense.category?.name ?? "",
      amount: Number(expense.amount),
      referenceNo: expense.referenceNo ?? "",
      notes: expense.notes ?? "",
    },
  });

  useEffect(() => {
    if (!expenseData) {
      return;
    }

    reset({
      description: expenseData.description,
      categoryId: expenseData.category?.id ?? null,
      categoryName: expenseData.category?.name ?? "",
      amount: Number(expenseData.amount),
      referenceNo: expenseData.referenceNo ?? "",
      notes: expenseData.notes ?? "",
    });
  }, [expenseData, reset]);

  const selectedCategoryId = useWatch({
    control,
    name: "categoryId",
  });

  const categorySelectValue =
    selectedCategoryId !== null && selectedCategoryId !== undefined
      ? String(selectedCategoryId)
      : "";

  const onUpdateExpense = async (data: ExpenseUpdate) => {
    try {
      await updateExpense.mutateAsync({ id: expense.id, data });
      toast.success("Expense updated successfully");
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update expense";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Update Expense"
      description="Update expense details"
      className="sm:max-w-112.5"
    >
      <form onSubmit={handleSubmit(onUpdateExpense)} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="update-description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="update-description"
            placeholder="Expense description"
            {...register("description", {
              required: "Description is required",
            })}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-category-select">
            Category <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Select
              value={categorySelectValue}
              onValueChange={(value) => {
                const parsedId = Number(value);
                setValue(
                  "categoryId",
                  Number.isNaN(parsedId) ? null : parsedId,
                  { shouldValidate: true },
                );
                setValue("categoryName", "", { shouldValidate: true });
              }}
            >
              <SelectTrigger id="update-category-select" className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => setOpenCreateCategory(true)}
              aria-label="Create category"
            >
              <Plus size={18} />
            </Button>
            <CreateExpenseCategoryDialog
              open={openCreateCategory}
              onOpenChange={setOpenCreateCategory}
              existingCategories={categoryOptions}
              onSuccess={(category) => {
                setCreatedCategory(category);
                setValue("categoryId", category.id, { shouldValidate: true });
                setValue("categoryName", "", { shouldValidate: true });
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-amount">
            Amount <span className="text-red-500">*</span>
          </Label>
          <StepperInput
            id="update-amount"
            step="0.01"
            min={0}
            placeholder="0.00"
            {...register("amount", {
              valueAsNumber: true,
              required: "Amount is required",
            })}
          />
          {errors.amount && (
            <p className="text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-referenceNo">Reference No</Label>
          <Input
            id="update-referenceNo"
            placeholder="INV-001"
            {...register("referenceNo")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-notes">Notes</Label>
          <Input
            id="update-notes"
            placeholder="Optional notes"
            {...register("notes")}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={updateExpense.isPending}
          >
            {updateExpense.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : null}
            Update Expense
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
