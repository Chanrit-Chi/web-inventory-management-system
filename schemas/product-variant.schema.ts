import { z } from "zod";
import { positiveInt, cuidSchema } from "./common.schema";

export const ProductVariantSchema = z.object({
  id: z.number().int(),
  productId: cuidSchema,
  stock: positiveInt.min(0, "Stock cannot be negative").default(0),
  reservedStock: positiveInt
    .min(0, "Reserved stock cannot be negative")
    .default(0),
  reorderLevel: positiveInt
    .min(0, "Reorder level cannot be negative")
    .default(0),
});

export const ProductVariantCreateSchema = ProductVariantSchema.omit({
  id: true,
});

export const ProductVariantUpdateSchema =
  ProductVariantCreateSchema.partial().extend({
    id: z.number().int(),
  });
