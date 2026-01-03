import { z } from "zod";
import { moneySchema, positiveInt, cuidSchema } from "./common.schema";
import { InvoiceStatusEnum } from "./enums.schema";

export const InvoiceSchema = z.object({
  id: cuidSchema,
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  orderId: z.number().int(),
  customerId: cuidSchema,
  status: InvoiceStatusEnum.default("SENT"),
  issuedDate: z.date().default(() => new Date()),
  dueDate: z.date().nullable().optional(),
  subtotal: moneySchema,
  taxPercent: positiveInt.max(100).default(0),
  taxAmount: moneySchema,
  discountPercent: positiveInt.max(100).default(0),
  discountAmount: moneySchema,
  totalAmount: moneySchema.default(0),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const InvoiceCreateSchema = InvoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const InvoiceUpdateSchema = InvoiceCreateSchema.partial().extend({
  id: cuidSchema,
});
