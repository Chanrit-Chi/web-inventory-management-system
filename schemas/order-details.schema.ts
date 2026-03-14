import { z } from "zod";
import {
  cuidSchema,
  positiveInt,
  baseMoneySchema,
  moneySchema,
} from "./common.schema";

/**
 * Base Order Detail Schema without defaults.
 */
export const OrderDetailSchema = z.object({
  id: z.number().int(),
  orderId: z.number().int(),
  productId: cuidSchema,
  variantId: z.number().int(),
  unitPrice: baseMoneySchema,
  quantity: positiveInt.min(1, "Quantity must be at least 1"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new Order Detail.
 */
export const OrderDetailCreateSchema = OrderDetailSchema.omit({
  id: true,
  orderId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  unitPrice: moneySchema.optional(),
  quantity: positiveInt.min(1, "Quantity must be at least 1").default(1),
});

/**
 * For API responses where we include product details.
 */
export const OrderDetailWithProductSchema = OrderDetailSchema.extend({
  product: z
    .object({
      name: z.string().optional().nullable(),
      sku: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  variant: z
    .object({
      sku: z.string().optional().nullable(),
      costPrice: baseMoneySchema.optional().nullable(),
      product: z
        .object({
          name: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});
