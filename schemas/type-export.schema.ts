import { z } from "zod";
import {
  ProductCreateSchema,
  ProductSchema,
  ProductUpdateSchema,
} from "./product.schema";
import {
  SupplierCreateSchema,
  SupplierSchema,
  SupplierUpdateSchema,
} from "./supplier.schema";
import {
  CustomerCreateSchema,
  CustomerSchema,
  CustomerUpdateSchema,
} from "./customer.schema";
import { OrderCreateSchema, OrderSchema } from "./order.schema";
import {
  InvoiceWithItemsSchema,
  OrderWithDetailsSchema,
  PurchaseOrderWithDetailsSchema,
  QuotationWithItemsSchema,
} from "./complex.schema";
import { InvoiceCreateSchema, InvoiceSchema } from "./invoice.schema";
import { QuotationCreateSchema, QuotationSchema } from "./quotation.schema";
import {
  PurchaseOrderCreateSchema,
  PurchaseOrderSchema,
} from "./purchase-order.schema";

export type Product = z.infer<typeof ProductSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

export type Supplier = z.infer<typeof SupplierSchema>;
export type SupplierCreate = z.infer<typeof SupplierCreateSchema>;
export type SupplierUpdate = z.infer<typeof SupplierUpdateSchema>;

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderWithDetails = z.infer<typeof OrderWithDetailsSchema>;

export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;
export type InvoiceWithItems = z.infer<typeof InvoiceWithItemsSchema>;

export type Quotation = z.infer<typeof QuotationSchema>;
export type QuotationCreate = z.infer<typeof QuotationCreateSchema>;
export type QuotationWithItems = z.infer<typeof QuotationWithItemsSchema>;

export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;
export type PurchaseOrderCreate = z.infer<typeof PurchaseOrderCreateSchema>;
export type PurchaseOrderWithDetails = z.infer<
  typeof PurchaseOrderWithDetailsSchema
>;
