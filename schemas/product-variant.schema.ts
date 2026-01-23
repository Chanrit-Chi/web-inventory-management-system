import { z } from "zod";
import { positiveInt, moneySchema, cuidSchema } from "./common.schema";

export const ProductVariantSchema = z.object({
  id: z.number().int(),
  sku: z.string().min(1, "Variant name is required"),
  productId: cuidSchema,
  costPrice: moneySchema,
  sellingPrice: moneySchema,
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

export const VariantAttributeInputSchema = z.object({
  valueId: z.number().int(),
});

export const ProductVariantCreateInputSchema =
  ProductVariantCreateSchema.extend({
    attributes: z.array(VariantAttributeInputSchema).optional(),
  });

export const ProductVariantUpdateSchema = ProductVariantCreateSchema.partial()
  .extend({
    id: z.number().int(),
  })
  .refine(
    (data) => Object.keys(data).length > 1,
    "At least one field must be provided for update",
  );
