import { z } from "zod";
import { cuidSchema, positiveInt, moneySchema } from "./common.schema";

export const OrderDetailSchema = z.object({
  id: z.number().int(),
  orderId: z.number().int(),
  productId: cuidSchema,
  variantId: z.number().int(),
  unitPrice: moneySchema,
  quantity: positiveInt.min(1, "Quantity must be at least 1").default(1),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const OrderDetailCreateSchema = OrderDetailSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
