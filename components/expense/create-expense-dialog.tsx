"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import {
  ExpenseCategory,
  ExpenseCreate,
} from "@/schemas/type-export.schema";
import { BaseDialog } from "@/components/dialog-template";
import {
  useExpenseMutations,
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

export function CreateExpenseDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [openCreateCategory, setOpenCreateCategory] = useState(false);
  const [createdCategory, setCreatedCategory] =
    useState<ExpenseCategory | null>(null);
  const { addExpense } = useExpenseMutations();
  const { data: categories } = useGetExpenseCategories();

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
  } = useForm<ExpenseCreate>({
    defaultValues: {
      amount: 0,
      description: "",
      categoryId: null,
      categoryName: "",
      expenseDate: new Date(),
      notes: "",
      referenceNo: "",
      paymentMethodId: null,
    },
  });

  const selectedCategoryId = useWatch({
    control,
    name: "categoryId",
  });

  const categorySelectValue =
    selectedCategoryId !== null && selectedCategoryId !== undefined
      ? String(selectedCategoryId)
      : "";

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  const onAddExpense = async (data: ExpenseCreate) => {
    try {
      if (data.categoryId == null) {
        toast.error("Please select a category");
        return;
      }

      await addExpense.mutateAsync(data);
      toast.success("Expense created successfully");
      onOpenChange(false);
      reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create expense";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add Expense"
      description="Record a new business expense"
      className="sm:max-w-112.5"
    >
      <form onSubmit={handleSubmit(onAddExpense)} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            {...register("expenseDate", {
              valueAsDate: true,
            })}
          />
          {errors.expenseDate && (
            <p className="text-xs text-red-500">{errors.expenseDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Input
            id="description"
            placeholder="Office electricity bill"
            {...register("description", {
              required: "Description is required",
            })}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categorySelect">
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
              <SelectTrigger id="categorySelect" className="w-full">
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
          <Label htmlFor="amount">
            Amount <span className="text-red-500">*</span>
          </Label>
          <StepperInput
            id="amount"
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
          <Label htmlFor="referenceNo">Reference No</Label>
          <Input
            id="referenceNo"
            placeholder="INV-001"
            {...register("referenceNo")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            placeholder="Optional notes"
            {...register("notes")}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={addExpense.isPending}
          >
            {addExpense.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Create Expense
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
