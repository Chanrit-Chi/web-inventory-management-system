import { z } from "zod";
import { OrderDetailCreateSchema } from "./order-details.schema";
import { OrderCreateSchema } from "./order.schema";
import { InvoiceCreateSchema } from "./invoice.schema";
import { InvoiceItemCreateSchema } from "./invoice-items.schema";
import { QuotationCreateSchema } from "./quotation.schema";
import { QuotationItemCreateSchema } from "./quotation-items.schema";
import { PurchaseOrderDetailCreateSchema } from "./purchase-order-detials.schema";
import { PurchaseOrderCreateSchema } from "./purchase-order.schema";

export const OrderWithDetailsSchema = OrderCreateSchema.extend({
  orderDetails: z
    .array(OrderDetailCreateSchema)
    .min(1, "At least one order item is required"),
});

export const InvoiceWithItemsSchema = InvoiceCreateSchema.extend({
  invoiceItems: z
    .array(InvoiceItemCreateSchema)
    .min(1, "At least one invoice item is required"),
});

export const QuotationWithItemsSchema = QuotationCreateSchema.extend({
  quotationItems: z
    .array(QuotationItemCreateSchema)
    .min(1, "At least one quotation item is required"),
});

export const PurchaseOrderWithDetailsSchema = PurchaseOrderCreateSchema.extend({
  purchaseOrderDetails: z
    .array(PurchaseOrderDetailCreateSchema)
    .min(1, "At least one item is required"),
});
