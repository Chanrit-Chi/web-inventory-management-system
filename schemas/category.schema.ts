import { z } from "zod";

export const CategorySchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const CategoryCreateSchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  }
);
