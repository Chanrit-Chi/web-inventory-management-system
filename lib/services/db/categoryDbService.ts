import { prisma } from "@/lib/prisma";
import {
  Category,
  CategoryCreate,
  CategoryUpdate,
} from "@/schemas/type-export.schema";

export const CategoryDbService = {
  fetchCategories: async (): Promise<Category[]> => {
    return prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
  fetchCategoryById: async (id: number): Promise<Category | null> => {
    return prisma.category.findUnique({
      where: { id },
    });
  },
  createCategory: async (category: CategoryCreate): Promise<Category> => {
    return prisma.category.create({
      data: category,
    });
  },
  updateCategory: async (
    id: number,
    category: CategoryUpdate
  ): Promise<Category> => {
    return prisma.category.update({
      where: { id },
      data: category,
    });
  },
  deleteCategory: async (id: number): Promise<Category> => {
    return prisma.category.delete({
      where: { id },
    });
  },
} as const;
