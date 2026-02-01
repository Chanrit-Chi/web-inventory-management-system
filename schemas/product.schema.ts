import { z } from "zod";
import { cuidSchema } from "./common.schema";
import { ProductStatusEnum } from "./enums.schema";
import { ProductVariantSchema } from "./product-variant.schema";

export const ProductSchema = z.object({
  id: cuidSchema,
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  image: z.string().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  categoryId: z.number().int().positive("Category is required"),
  unitId: z.number().int().positive("Unit is required"),
  productAttributes: z.array(z.number()),
  variants: z.array(ProductVariantSchema),
  supplierId: z.array(z.number().int().positive()).nullable().optional(),
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
  },
);
