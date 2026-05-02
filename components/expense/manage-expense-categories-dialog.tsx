"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import { ExpenseCategory } from "@/schemas/type-export.schema";
import { BaseDialog, ConfirmDialog } from "@/components/dialog-template";
import { useExpenseMutations, useGetExpenseCategories } from "@/hooks/useExpense";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePermission } from "@/hooks/usePermission";

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
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(category)}
                              disabled={!canUpdate}
                            >
                              <SquarePen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(category)}
                              disabled={!canDelete}
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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
