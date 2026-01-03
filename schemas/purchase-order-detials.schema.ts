import { z } from "zod";
import { cuidSchema, positiveInt } from "./common.schema";

export const PurchaseOrderDetailSchema = z.object({
  id: z.number().int(),
  purchaseOrderId: z.number().int(),
  productId: cuidSchema,
  variantId: z.number().int(),
  unitPrice: positiveInt.min(0, "Unit price must be non-negative").default(0),
  quantity: positiveInt.min(1, "Quantity must be at least 1").default(1),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const PurchaseOrderDetailCreateSchema = PurchaseOrderDetailSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
