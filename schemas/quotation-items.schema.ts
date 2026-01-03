import { z } from "zod";
import { cuidSchema, positiveInt } from "./common.schema";

export const QuotationItemSchema = z.object({
  id: z.number().int(),
  quotationId: cuidSchema,
  productId: cuidSchema,
  productName: z.string().min(1, "Product name is required"),
  variantId: z.number().int().nullable().optional(),
  sku: z.string().min(1, "SKU is required"),
  quantity: positiveInt.min(1, "Quantity must be at least 1"),
  unitPrice: positiveInt.min(0, "Unit price must be non-negative"),
  lineTotal: positiveInt.min(0, "Line total must be non-negative"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const QuotationItemCreateSchema = QuotationItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
