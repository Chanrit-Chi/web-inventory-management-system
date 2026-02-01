import {
  CategoryCreateSchema,
  CategoryUpdateSchema,
} from "@/schemas/category.schema";
import {
  Category,
  CategoryCreate,
  CategoryUpdate,
} from "@/schemas/type-export.schema";

export const categoryApiService = {
  fetchCategories: async (): Promise<Category[]> => {
    const res = await fetch("/api/categories");

    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }
    return res.json();
  },

  fetchCategoryById: async (id: number): Promise<Category> => {
    const res = await fetch(`/api/categories/${id}`);

    if (!res.ok) {
      throw new Error("Failed to fetch category");
    }
    return res.json();
  },

  addCategory: async (category: CategoryCreate): Promise<Category> => {
    const validateCategory = CategoryCreateSchema.parse(category);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validateCategory),
    });

    if (!res.ok) {
      throw new Error("Failed to add category");
    }
    return res.json();
  },

  updateCategory: async (
    id: number,
    category: CategoryUpdate,
  ): Promise<Category> => {
    const validateCategory = CategoryUpdateSchema.parse(category);
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validateCategory),
    });

    if (!res.ok) {
      throw new Error("Failed to update category");
    }
    return res.json();
  },

  deleteCategory: async (id: number): Promise<void> => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Failed to delete category with id ${id}`);
    }
  },
};
