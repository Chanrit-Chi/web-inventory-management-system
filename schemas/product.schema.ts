import { z } from "zod";
import { cuidSchema, moneySchema } from "./common.schema";
import { ProductStatusEnum } from "./enums.schema";

export const ProductSchema = z.object({
  id: cuidSchema,
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  image: z.url().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  costPrice: moneySchema,
  sellingPrice: moneySchema,
  unit: z.string().min(1, "Unit is required"),
  categoryId: z.number().int().positive("Category is required"),
  isActive: ProductStatusEnum.default("ACTIVE"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const ProductCreateSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ProductUpdateSchema = ProductCreateSchema.partial();
