"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ExpenseCategory, ExpenseCategoryCreate } from "@/schemas/type-export.schema";
import { BaseDialog } from "@/components/dialog-template";
import { useExpenseMutations } from "@/hooks/useExpense";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function CreateExpenseCategoryDialog({
  open,
  onOpenChange,
  existingCategories,
  onSuccess,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly existingCategories?: ExpenseCategory[];
  readonly onSuccess?: (category: ExpenseCategory) => void;
}) {
  const { addExpenseCategory } = useExpenseMutations();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseCategoryCreate>({
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const onCreateCategory = async (data: ExpenseCategoryCreate) => {
    try {
      const normalizedName = data.name.trim();
      const existingCategory = (existingCategories || []).find(
        (category) =>
          category.name.trim().toLowerCase() === normalizedName.toLowerCase(),
      );

      if (existingCategory) {
        toast.success("Category selected");
        onSuccess?.(existingCategory);
        onOpenChange(false);
        reset();
        return;
      }

      const category = await addExpenseCategory.mutateAsync({
        ...data,
        name: normalizedName,
        description: data.description?.trim() || null,
      });

      toast.success("Category created successfully");
      onSuccess?.(category);
      onOpenChange(false);
      reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create category";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Create Category"
      description="Add a new expense category"
      className="sm:max-w-112.5"
    >
      <form
        onSubmit={handleSubmit(onCreateCategory)}
        className="space-y-4 py-4"
      >
        <div className="space-y-2">
          <Label htmlFor="create-category-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="create-category-name"
            placeholder="Utilities"
            {...register("name", { required: "Category name is required" })}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="create-category-description">Description</Label>
          <Input
            id="create-category-description"
            placeholder="Optional description"
            {...register("description")}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={addExpenseCategory.isPending}
          >
            {addExpenseCategory.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : null}
            Create Category
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
