import {
  Category,
  CategoryCreate,
  CategoryUpdate,
} from "@/schemas/type-export.schema";
import { useCategoryMutations, useGetCategoryById } from "@/hooks/useCategory";
import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
} from "@/schemas/category.schema";
import { toast } from "sonner";

import {
  ConfirmDialog,
  FormDialog,
  ViewDialog,
} from "@/components/dialog-template";

// Create Category Dialog
export function CreateCategoryDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { addCategory } = useCategoryMutations();

  const handleSubmit = async (data: CategoryCreate) => {
    try {
      await addCategory.mutateAsync(data);
      toast.success("Category created successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create category");
      console.error(error);
    }
  };

  return (
    <FormDialog<typeof CategoryCreateSchema>
      open={open}
      onOpenChange={onOpenChange}
      title="Create Category"
      description="Add a new category to your inventory"
      schema={CategoryCreateSchema}
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Enter category name",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Enter category description",
        },
      ]}
      defaultValues={{
        name: "",
        description: "",
      }}
      onSubmit={handleSubmit}
      submitLabel="Create"
      isSubmitting={addCategory.isPending}
    />
  );
}

// View Category Dialog
export function ViewCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  readonly category: Category;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <ViewDialog<Category>
      open={open}
      onOpenChange={onOpenChange}
      title="View Category"
      description="Category details and information"
      item={category}
      fields={[
        {
          label: "Name",
          value: (cat) => cat.name,
        },
        {
          label: "Description",
          value: (cat) => cat.description || "No description",
        },
        {
          label: "Created At",
          value: (cat) => new Date(cat.createdAt).toLocaleString(),
        },
        {
          label: "Updated At",
          value: (cat) => new Date(cat.updatedAt).toLocaleString(),
        },
      ]}
    />
  );
}

// Update Category Dialog
export function UpdateCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  readonly category: Category;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { updateCategory } = useCategoryMutations();
  const { data: categoryData } = useGetCategoryById(category.id);

  const handleSubmit = async (data: CategoryUpdate) => {
    try {
      await updateCategory.mutateAsync({ id: category.id, data });
      toast.success("Category updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update category");
      console.error(error);
    }
  };

  return (
    <FormDialog<typeof CategoryUpdateSchema>
      open={open}
      onOpenChange={onOpenChange}
      title="Update Category"
      description="Make changes to the category information"
      schema={CategoryUpdateSchema}
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Enter category name",
          required: true,
        },
        {
          name: "description",
          label: "Description",
          placeholder: "Enter category description",
        },
      ]}
      defaultValues={{
        name: categoryData?.name || category.name,
        description: categoryData?.description || category.description || "",
      }}
      onSubmit={handleSubmit}
      submitLabel="Updating"
      isSubmitting={updateCategory.isPending}
    />
  );
}

// Delete Category Dialog
export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  readonly category: Category;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
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
    <ConfirmDialog<Category>
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Category"
      description="Are you sure you want to delete this category? This action cannot be undone."
      item={category}
      renderItem={(cat) => (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold">Category Name:</p>
          <p className="text-sm">{cat.name}</p>
          {cat.description && (
            <>
              <p className="text-sm font-semibold mt-2">Description:</p>
              <p className="text-sm">{cat.description}</p>
            </>
          )}
        </div>
      )}
      onConfirm={handleDelete}
      confirmLabel="Deleting"
      isLoading={deleteCategory.isPending}
    />
  );
}
