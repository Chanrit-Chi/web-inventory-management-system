import { z } from "zod";

export const ProductStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const StockMovementTypeEnum = z.enum([
  "INITIAL",
  "SALE",
  "PURCHASE",
  "ADJUSTMENT",
  "RETURN",
  "DAMAGE",
]);

export const OrderStatusEnum = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);

export const InvoiceStatusEnum = z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]);

export const QuotationStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CONVERTED",
]);

export const AttributeTypeEnum = z.enum(["SELECT", "COLOR", "TEXT"]);
