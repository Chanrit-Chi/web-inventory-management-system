import { z } from "zod";
import {
  moneySchema,
  baseMoneySchema,
  positiveInt,
  cuidSchema,
} from "./common.schema";
import { OrderStatusEnum } from "./enums.schema";

/**
 * Base Order Schema without defaults.
 * Used for building other schemas and for partial updates.
 */
export const OrderSchema = z.object({
  id: z.number().int(),
  customerId: cuidSchema,
  totalPrice: baseMoneySchema,
  status: OrderStatusEnum,
  paymentMethodId: z.number().int().positive("Payment method is required"),
  discountPercent: positiveInt.max(100, "Discount must be between 0-100"),
  discountAmount: baseMoneySchema,
  taxPercent: positiveInt.min(0).max(100, "Tax must be between 0-100"),
  taxAmount: baseMoneySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new Order.
 * Includes defaults for optional financial fields.
 */
export const OrderCreateSchema = OrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: OrderStatusEnum.default("COMPLETED"),
  totalPrice: moneySchema,
  discountPercent: positiveInt
    .max(100, "Discount must be between 0-100")
    .default(0),
  discountAmount: moneySchema,
  taxPercent: positiveInt
    .min(0)
    .max(100, "Tax must be between 0-100")
    .default(0),
  taxAmount: moneySchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * Schema for updating an existing Order.
 * Made partial to allow updating only specific fields without resetting others to defaults.
 */
export const OrderUpdateSchema = OrderSchema.omit({
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .extend({
    id: z.number().int(),
  });
