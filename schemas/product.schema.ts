import { z } from "zod";
import { cuidSchema } from "./common.schema";
import { ProductStatusEnum } from "./enums.schema";

export const ProductSchema = z.object({
  id: cuidSchema,
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  image: z.string().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  unit: z.string().min(1, "Unit is required"),
  categoryId: z.number().int().positive("Category is required"),
  isActive: ProductStatusEnum.default("ACTIVE"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ProductCreateSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ProductUpdateSchema = ProductCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be updated",
  }
);
