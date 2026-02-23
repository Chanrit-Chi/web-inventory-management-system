import { z } from "zod";
import {
  cuidSchema,
  moneySchema,
  baseMoneySchema,
  positiveInt,
} from "./common.schema";

/**
 * Base Quotation Item Schema without defaults.
 */
export const QuotationItemSchema = z.object({
  id: z.number().int(),
  quotationId: cuidSchema,
  productId: cuidSchema,
  productName: z.string().min(1, "Product name is required"),
  variantId: z.number().int().nullable().optional(),
  sku: z.string().min(1, "SKU is required"),
  quantity: positiveInt.min(1, "Quantity must be at least 1"),
  unitPrice: baseMoneySchema,
  lineTotal: baseMoneySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new Quotation Item.
 */
export const QuotationItemCreateSchema = QuotationItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  unitPrice: moneySchema,
  lineTotal: moneySchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});
