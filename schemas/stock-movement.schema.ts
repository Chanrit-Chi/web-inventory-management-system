import { z } from "zod";
import { positiveInt } from "./common.schema";
import { StockMovementTypeEnum } from "./enums.schema";

export const StockMovementSchema = z.object({
  id: z.number().int(),
  variantId: z.number().int(),
  movementType: StockMovementTypeEnum,
  quantity: positiveInt,
  previousStock: positiveInt,
  newStock: positiveInt,
  orderId: z.number().int().nullable().optional(),
  purchaseOrderId: z.number().int().nullable().optional(),
  reason: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  createdBy: z.string().nullable().optional(),
});

export const StockMovementCreateSchema = StockMovementSchema.omit({
  id: true,
  createdAt: true,
});
