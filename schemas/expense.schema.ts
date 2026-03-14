import { z } from "zod";
import { cuidSchema } from "./common.schema";

export const ExpenseCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const ExpenseSchema = z.object({
  id: cuidSchema,
  amount: z.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  expenseDate: z.date().default(() => new Date()),
  categoryId: z.number().int().positive(),
  paymentMethodId: z.number().int().positive().nullable().optional(),
  referenceNo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  category: ExpenseCategorySchema.optional(),
  paymentMethod: z
    .object({
      id: z.number().int().positive(),
      name: z.string(),
    })
    .nullable()
    .optional(),
});

const ExpenseInputSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  expenseDate: z.coerce.date().optional(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  categoryName: z.string().trim().optional(),
  paymentMethodId: z.coerce.number().int().positive().optional().nullable(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ExpenseCreateSchema = ExpenseInputSchema.refine(
  (data) =>
    (data.categoryId != null && !Number.isNaN(data.categoryId)) ||
    Boolean(data.categoryName?.trim()),
  {
    message: "Category is required",
    path: ["categoryId"],
  },
);

export const ExpenseUpdateSchema = ExpenseInputSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  },
);

export const ExpenseCategoryCreateSchema = ExpenseCategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ExpenseCategoryUpdateSchema = ExpenseCategoryCreateSchema.partial();
