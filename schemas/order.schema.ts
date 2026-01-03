import { z } from "zod";
import { moneySchema, positiveInt, cuidSchema } from "./common.schema";
import { OrderStatusEnum } from "./enums.schema";

export const OrderSchema = z.object({
  id: z.number().int(),
  customerId: cuidSchema,
  totalPrice: moneySchema,
  status: OrderStatusEnum.default("COMPLETED"),
  paymentMethodId: z.number().int().positive("Payment method is required"),
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

export const OrderCreateSchema = OrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const OrderUpdateSchema = OrderCreateSchema.partial().extend({
  id: z.number().int(),
});
