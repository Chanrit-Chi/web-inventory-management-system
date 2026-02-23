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

export const batchItemSchema = z.object({
  variantId: z.number().min(1, "Required"),
  movementType: StockMovementTypeEnum,
  action: z.enum(["add", "subtract"] as const),
  quantity: z.number().int("Must be a whole number"),
  reason: z.string().min(3, "Min 3 chars").max(100),
  // Meta fields for UI
  productName: z.string(),
  sku: z.string(),
  attributes: z.string(),
  image: z.string().optional().nullable(),
});

export const batchAdjustmentSchema = z.object({
  items: z.array(batchItemSchema).min(1, "Add at least one item"),
});
