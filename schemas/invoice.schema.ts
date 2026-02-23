import { z } from "zod";
import {
  moneySchema,
  baseMoneySchema,
  positiveInt,
  cuidSchema,
} from "./common.schema";
import { InvoiceStatusEnum } from "./enums.schema";

/**
 * Base Invoice Schema without defaults.
 */
export const InvoiceSchema = z.object({
  id: cuidSchema,
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  orderId: z.number().int(),
  customerId: cuidSchema,
  status: InvoiceStatusEnum,
  issuedDate: z.date(),
  dueDate: z.date().nullable().optional(),
  subtotal: baseMoneySchema,
  taxPercent: positiveInt.max(100),
  taxAmount: baseMoneySchema,
  discountPercent: positiveInt.max(100),
  discountAmount: baseMoneySchema,
  totalAmount: baseMoneySchema,
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new Invoice.
 */
export const InvoiceCreateSchema = InvoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: InvoiceStatusEnum.default("SENT"),
  issuedDate: z.date().default(() => new Date()),
  subtotal: moneySchema,
  taxPercent: positiveInt.max(100).default(0),
  taxAmount: moneySchema,
  discountPercent: positiveInt.max(100).default(0),
  discountAmount: moneySchema,
  totalAmount: moneySchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * Schema for updating an existing Invoice.
 */
export const InvoiceUpdateSchema = InvoiceSchema.omit({
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .extend({
    id: cuidSchema,
  });
