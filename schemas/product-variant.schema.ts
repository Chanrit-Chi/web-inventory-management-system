import { z } from "zod";
import { positiveInt, moneySchema } from "./common.schema";

export const ProductVariantSchema = z.object({
  id: z.number().int().optional(),
  productId: z.string().optional(),
  sku: z.string().min(1, "Variant name is required"),
  barcode: z.string().trim().optional().nullable(),
  costPrice: moneySchema,
  sellingPrice: moneySchema,
  stock: positiveInt.min(0, "Stock cannot be negative").default(0),
  isActive: z.boolean().default(true),
  reservedStock: positiveInt
    .min(0, "Reserved stock cannot be negative")
    .default(0),
  reorderLevel: positiveInt
    .min(0, "Reorder level cannot be negative")
    .default(0),
  _count: z
    .object({
      orderDetail: z.number().int().default(0),
    })
    .optional(),
  attributes: z
    .array(
      z.object({
        valueId: z.number(),
        value: z
          .union([
            // Structure from DB
            z.object({
              value: z.string(),
              displayValue: z.string().optional(),
              colorHex: z.string().nullable().optional(),
              attribute: z.object({
                name: z.string(),
              }),
            }),
            // Direct string value (sometimes passed during form submission)
            z.string(),
          ])
          .optional(),
        attributeName: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export const ProductVariantCreateSchema = ProductVariantSchema.omit({
  id: true,
});

export const ProductVariantUpdateSchema = ProductVariantCreateSchema.partial()
  .extend({
    id: z.number().int(),
  })
  .refine(
    (data) => Object.keys(data).length > 1,
    "At least one field must be provided for update",
  );
