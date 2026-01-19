"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Category, CategoryCreate } from "@/schemas/type-export.schema";
import { useCategoryMutations, useGetCategoryById } from "@/hooks/useCategory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategoryCreateSchema } from "@/schemas/category.schema";
import { toast } from "sonner";

interface ViewCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addCategory } = useCategoryMutations();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryCreate>({
    resolver: zodResolver(CategoryCreateSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CategoryCreate) => {
    try {
      await addCategory.mutateAsync(data);
      toast.success("Category created successfully");
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error("Failed to create category");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Add a new category to your inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-name"
                {...register("name")}
                placeholder="Enter category name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                {...register("description")}
                placeholder="Enter category description"
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addCategory.isPending}>
              {addCategory.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ViewCategoryDialog({
  category,
  open,
  onOpenChange,
}: ViewCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>View Category</DialogTitle>
          <DialogDescription>
            Category details and information
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="font-semibold">Name</Label>
            <p className="text-sm">{category.name}</p>
          </div>
          <div className="grid gap-2">
            <Label className="font-semibold">Description</Label>
            <p className="text-sm">
              {category.description || "No description"}
            </p>
          </div>
          <div className="grid gap-2">
            <Label className="font-semibold">Created At</Label>
            <p className="text-sm">
              {new Date(category.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="grid gap-2">
            <Label className="font-semibold">Updated At</Label>
            <p className="text-sm">
              {new Date(category.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UpdateCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateCategoryDialog({
  category,
  open,
  onOpenChange,
}: UpdateCategoryDialogProps) {
  const { updateCategory } = useCategoryMutations();
  const { data: categoryData } = useGetCategoryById(category.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryCreate>({
    resolver: zodResolver(CategoryCreateSchema),
    defaultValues: {
      name: categoryData?.name || category.name,
      description: categoryData?.description || category.description || "",
    },
  });

  const onSubmit = async (data: CategoryCreate) => {
    try {
      await updateCategory.mutateAsync({ id: category.id, data });
      toast.success("Category updated successfully");
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error("Failed to update category");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Category</DialogTitle>
          <DialogDescription>
            Make changes to the category information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter category name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Enter category description"
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateCategory.isPending}>
              {updateCategory.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteCategoryDialogProps {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const { deleteCategory } = useCategoryMutations();

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Category deleted successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete category");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">Category Name:</p>
            <p className="text-sm">{category.name}</p>
            {category.description && (
              <>
                <p className="text-sm font-semibold mt-2">Description:</p>
                <p className="text-sm">{category.description}</p>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
          >
            {deleteCategory.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
