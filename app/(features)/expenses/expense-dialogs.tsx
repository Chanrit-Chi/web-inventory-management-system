import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Expense,
  ExpenseCategory,
  ExpenseCategoryCreate,
  ExpenseCreate,
  ExpenseUpdate,
} from "@/schemas/type-export.schema";
import {
  BaseDialog,
  ConfirmDialog,
  ViewDialog,
} from "@/components/dialog-template";
import {
  useExpenseMutations,
  useGetExpenseById,
  useGetExpenseCategories,
} from "@/hooks/useExpense";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/usePermission";

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
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
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
          <Input
            id="update-amount"
            type="number"
            step="0.01"
            min="0"
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

function CreateExpenseCategoryDialog({
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

export function ManageExpenseCategoriesDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { data: categories } = useGetExpenseCategories(true);
  const { addExpenseCategory, updateExpenseCategory, deleteExpenseCategory } =
    useExpenseMutations();
  const { can } = usePermission();

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingActive, setEditingActive] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(
    null,
  );

  const canCreate = can("expense:create");
  const canUpdate = can("expense:update");
  const canDelete = can("expense:delete");

  const startEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingDescription(category.description || "");
    setEditingActive(category.isActive);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingDescription("");
    setEditingActive(true);
  };

  const handleCreateCategory = async () => {
    if (!newName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await addExpenseCategory.mutateAsync({
        name: newName.trim(),
        description: newDescription.trim() || null,
        isActive: true,
      });

      toast.success("Category created successfully");
      setNewName("");
      setNewDescription("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create category";
      toast.error(errorMessage);
    }
  };

  const handleUpdateCategory = async () => {
    if (editingId == null) {
      return;
    }

    if (!editingName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await updateExpenseCategory.mutateAsync({
        id: editingId,
        data: {
          name: editingName.trim(),
          description: editingDescription.trim() || null,
          isActive: editingActive,
        },
      });

      toast.success("Category updated successfully");
      cancelEdit();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update category";
      toast.error(errorMessage);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;

    try {
      await deleteExpenseCategory.mutateAsync(deleteTarget.id);
      toast.success("Category deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete category";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <BaseDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Manage Expense Categories"
        description="Create, update, and delete expense categories"
        className="sm:max-w-112.5"
      >
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Create Category</h3>
            <div className="space-y-2">
              <Label htmlFor="manage-category-name">Name</Label>
              <Input
                id="manage-category-name"
                placeholder="Utilities"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manage-category-description">Description</Label>
              <Input
                id="manage-category-description"
                placeholder="Optional description"
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handleCreateCategory}
              disabled={!canCreate || addExpenseCategory.isPending}
            >
              {addExpenseCategory.isPending ? (
                <Spinner className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Category
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Existing Categories</h3>
            <div className="max-h-80 overflow-y-auto border rounded-lg">
              {(categories || []).length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No categories found
                </div>
              ) : (
                <div className="divide-y">
                  {(categories || []).map((category) => (
                    <div key={category.id} className="p-3 space-y-2">
                      {editingId === category.id ? (
                        <>
                          <Input
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            placeholder="Category name"
                          />
                          <Input
                            value={editingDescription}
                            onChange={(event) =>
                              setEditingDescription(event.target.value)
                            }
                            placeholder="Optional description"
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              id="edit-category-active"
                              checked={editingActive}
                              onCheckedChange={setEditingActive}
                            />
                            <Label
                              htmlFor="edit-category-active"
                              className="text-xs"
                            >
                              Active
                            </Label>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleUpdateCategory}
                              disabled={
                                !canUpdate || updateExpenseCategory.isPending
                              }
                            >
                              {updateExpenseCategory.isPending ? (
                                <Spinner className="mr-2 h-4 w-4" />
                              ) : null}
                              Save
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {category.name}
                              </p>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  category.isActive
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-muted text-muted-foreground border-border"
                                }`}
                              >
                                {category.isActive ? "Active" : "Deactivated"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {category.description || "No description"}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => startEdit(category)}
                              disabled={!canUpdate}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setDeleteTarget(category)}
                              disabled={!canDelete}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </BaseDialog>

      <ConfirmDialog<ExpenseCategory>
        open={Boolean(deleteTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTarget(null);
        }}
        title="Delete Category"
        description="Are you sure you want to delete this category? If already used in expenses, it will be deactivated instead."
        item={
          deleteTarget ||
          ({
            id: 0,
            name: "",
            description: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as ExpenseCategory)
        }
        renderItem={(category) => (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-semibold">{category.name}</p>
            <p className="text-muted-foreground">
              {category.description || "No description"}
            </p>
          </div>
        )}
        onConfirm={handleDeleteCategory}
        confirmLabel="Deleting"
        isLoading={deleteExpenseCategory.isPending}
      />
    </>
  );
}
