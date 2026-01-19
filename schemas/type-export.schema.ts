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
import {
  OrderCreateSchema,
  OrderSchema,
  OrderUpdateSchema,
} from "./order.schema";
import {
  InvoiceWithItemsSchema,
  OrderWithDetailsSchema,
  OrderWithRelationsSchema,
  ProductAttributeWithValuesSchema,
  ProductVariantWithAttributesSchema,
  ProductWithVariantsSchema,
  PurchaseOrderWithDetailsSchema,
  QuotationWithItemsSchema,
  VariantWithAttributeLinksSchema,
} from "./complex.schema";
import { InvoiceCreateSchema, InvoiceSchema } from "./invoice.schema";
import { QuotationCreateSchema, QuotationSchema } from "./quotation.schema";
import {
  PurchaseOrderCreateSchema,
  PurchaseOrderSchema,
} from "./purchase-order.schema";
import {
  ProductVariantCreateSchema,
  ProductVariantSchema,
  ProductVariantUpdateSchema,
} from "./product-variant.schema";
import {
  ProductAttributeCreateSchema,
  ProductAttributeSchema,
  ProductAttributeUpdateSchema,
  ProductAttributeValueCreateSchema,
  ProductAttributeValueSchema,
  ProductAttributeValueUpdateSchema,
  ProductOnAttributeCreateSchema,
  ProductOnAttributeSchema,
  ProductVariantAttributeCreateSchema,
  ProductVariantAttributeSchema,
  ProductVariantAttributeUpdateSchema,
} from "./product-attribute.schema";
import {
  CategoryCreateSchema,
  CategorySchema,
  CategoryUpdateSchema,
} from "./category.schema";

export type Category = z.infer<typeof CategorySchema>;
export type CategoryCreate = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdate = z.infer<typeof CategoryUpdateSchema>;

export type Product = z.infer<typeof ProductSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type ProductVariantCreate = z.infer<typeof ProductVariantCreateSchema>;
export type ProductVariantUpdate = z.infer<typeof ProductVariantUpdateSchema>;

export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;
export type ProductAttributeCreate = z.infer<
  typeof ProductAttributeCreateSchema
>;
export type ProductAttributeUpdate = z.infer<
  typeof ProductAttributeUpdateSchema
>;

export type ProductAttributeValue = z.infer<typeof ProductAttributeValueSchema>;
export type ProductAttributeValueCreate = z.infer<
  typeof ProductAttributeValueCreateSchema
>;
export type ProductAttributeValueUpdate = z.infer<
  typeof ProductAttributeValueUpdateSchema
>;

export type ProductVariantAttribute = z.infer<
  typeof ProductVariantAttributeSchema
>;
export type ProductVariantAttributeCreate = z.infer<
  typeof ProductVariantAttributeCreateSchema
>;
export type ProductVariantAttributeUpdate = z.infer<
  typeof ProductVariantAttributeUpdateSchema
>;

export type ProductOnAttribute = z.infer<typeof ProductOnAttributeSchema>;
export type ProductOnAttributeCreate = z.infer<
  typeof ProductOnAttributeCreateSchema
>;

// Complex product types
export type ProductWithVariants = z.infer<typeof ProductWithVariantsSchema>;
export type ProductVariantWithAttributes = z.infer<
  typeof ProductVariantWithAttributesSchema
>;
export type ProductAttributeWithValues = z.infer<
  typeof ProductAttributeWithValuesSchema
>;
export type VariantWithAttributeLinks = z.infer<
  typeof VariantWithAttributeLinksSchema
>;

export type Supplier = z.infer<typeof SupplierSchema>;
export type SupplierCreate = z.infer<typeof SupplierCreateSchema>;
export type SupplierUpdate = z.infer<typeof SupplierUpdateSchema>;

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;

export type Order = z.infer<typeof OrderSchema>;
export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderWithDetails = z.infer<typeof OrderWithDetailsSchema>;
export type OrderWithRelations = z.infer<typeof OrderWithRelationsSchema>;
export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;

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
