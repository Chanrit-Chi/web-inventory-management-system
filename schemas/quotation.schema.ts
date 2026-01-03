import { z } from "zod";
import { cuidSchema, positiveInt } from "./common.schema";
import { QuotationStatusEnum } from "./enums.schema";

export const QuotationSchema = z.object({
  id: cuidSchema,
  quotationNumber: z.string().min(1, "Quotation number is required"),
  customerId: cuidSchema,
  issueDate: z.date().default(() => new Date()),
  validUntil: z.date(),
  subtotal: positiveInt.min(0, "Subtotal must be non-negative"),
  discountPercent: z.number().int().min(0).max(100).default(0),
  discountAmount: positiveInt
    .min(0, "Discount amount must be non-negative")
    .default(0),
  taxPercent: z.number().int().min(0).max(100).default(0),
  taxAmount: positiveInt.min(0, "Tax amount must be non-negative").default(0),
  totalAmount: positiveInt.min(0, "Total amount must be non-negative"),
  status: QuotationStatusEnum.default("DRAFT"),
  convertedOrderId: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const QuotationCreateSchema = QuotationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const QuotationUpdateSchema = QuotationCreateSchema.partial().extend({
  id: cuidSchema,
});
