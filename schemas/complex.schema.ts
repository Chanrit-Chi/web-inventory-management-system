import { z } from "zod";
import { OrderDetailCreateSchema } from "./order-details.schema";
import { OrderCreateSchema, OrderSchema } from "./order.schema";
import { InvoiceCreateSchema } from "./invoice.schema";
import { InvoiceItemCreateSchema } from "./invoice-items.schema";
import { QuotationCreateSchema } from "./quotation.schema";
import { QuotationItemCreateSchema } from "./quotation-items.schema";
import { PurchaseOrderDetailCreateSchema } from "./purchase-order-detials.schema";
import { PurchaseOrderCreateSchema } from "./purchase-order.schema";
import { ProductVariantCreateSchema } from "./product-variant.schema";
import { ProductAttributeCreateSchema } from "./product-attribute.schema";

export const OrderWithDetailsSchema = OrderCreateSchema.extend({
  orderDetails: z
    .array(OrderDetailCreateSchema)
    .min(1, "At least one order item is required"),
});

// Order with relations (for API responses)
export const OrderWithRelationsSchema = OrderSchema.extend({
  customer: z
    .object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      address: z.string(),
    })
    .optional(),
  paymentMethod: z
    .object({
      name: z.string(),
    })
    .optional(),
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

// For variant attribute assignment (uses valueId from ProductAttributeValue)
const VariantAttributeInputSchema = z.object({
  valueId: z.number().int(), // Direct reference to attribute value
});

export const ProductVariantWithAttributesSchema =
  ProductVariantCreateSchema.extend({
    attributes: z.array(VariantAttributeInputSchema).optional(),
  });

// Product Attribute with its values (global attribute definition)
export const ProductAttributeWithValuesSchema =
  ProductAttributeCreateSchema.extend({
    values: z
      .array(
        z.object({
          value: z.string().min(1, "Attribute value is required"),
        }),
      )
      .min(1, "At least one attribute value is required"),
  });

// For updating/linking variant attributes
export const VariantWithAttributeLinksSchema = z.object({
  variantId: z.number().int(),
  valueIds: z.array(z.number().int()).min(1, "At least one value is required"), // Array of ProductAttributeValue IDs
});
