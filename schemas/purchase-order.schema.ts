import { z } from "zod";
import { OrderStatusEnum } from "./enums.schema";
import { cuidSchema } from "./common.schema";

export const PurchaseOrderSchema = z.object({
  id: z.number().int(),
  supplierId: cuidSchema,
  status: OrderStatusEnum.default("COMPLETED"),
  totalAmount: z
    .number()
    .min(0, "Total amount must be non-negative")
    .default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const PurchaseOrderCreateSchema = PurchaseOrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const PurchaseOrderUpdateSchema =
  PurchaseOrderCreateSchema.partial().extend({
    id: z.number().int(),
  });
