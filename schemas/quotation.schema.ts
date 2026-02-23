import { z } from "zod";
import { baseMoneySchema, cuidSchema, moneySchema } from "./common.schema";
import { QuotationStatusEnum } from "./enums.schema";

/**
 * Base Quotation Schema without defaults.
 */
export const QuotationSchema = z.object({
  id: cuidSchema,
  quotationNumber: z.string().min(1, "Quotation number is required"),
  customerId: cuidSchema,
  issueDate: z.date(),
  validUntil: z.date(),
  subtotal: baseMoneySchema,
  discountPercent: z.number().int().min(0).max(100),
  discountAmount: baseMoneySchema,
  taxPercent: z.number().int().min(0).max(100),
  taxAmount: baseMoneySchema,
  totalAmount: baseMoneySchema,
  status: QuotationStatusEnum,
  convertedOrderId: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new Quotation.
 */
export const QuotationCreateSchema = QuotationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  issueDate: z.date().default(() => new Date()),
  subtotal: moneySchema,
  discountPercent: z.number().int().min(0).max(100).default(0),
  discountAmount: moneySchema,
  taxPercent: z.number().int().min(0).max(100).default(0),
  taxAmount: moneySchema,
  totalAmount: moneySchema,
  status: QuotationStatusEnum.default("DRAFT"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * Schema for updating an existing Quotation.
 */
export const QuotationUpdateSchema = QuotationSchema.omit({
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .extend({
    id: cuidSchema,
  });
