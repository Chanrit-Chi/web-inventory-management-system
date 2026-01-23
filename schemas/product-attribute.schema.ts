import { z } from "zod";
import { cuidSchema } from "./common.schema";

// Global attribute (e.g., "Color", "Size")
export const ProductAttributeSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, "Attribute name is required").max(50),
});

export const ProductAttributeCreateSchema = ProductAttributeSchema.omit({
  id: true,
});

export const ProductAttributeUpdateSchema =
  ProductAttributeCreateSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be updated",
    },
  );

export const ProductAttributeValueSchema = z.object({
  id: z.number().int(),
  value: z.string().min(1, "Attribute value is required"),
  attributeId: z.number().int(),
});

export const ProductAttributeValueCreateSchema =
  ProductAttributeValueSchema.omit({
    id: true,
  });

export const ProductAttributeValueUpdateSchema =
  ProductAttributeValueCreateSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be updated",
    },
  );

// export const ProductVariantAttributeSchema = z.object({
//   id: z.number().int(),
//   variantId: z.number().int(),
//   valueId: z.number().int(),
// });

// export const ProductVariantAttributeCreateSchema =
//   ProductVariantAttributeSchema.omit({
//     id: true,
//   });

// export const ProductVariantAttributeUpdateSchema =
//   ProductVariantAttributeCreateSchema.partial().refine(
//     (data) => Object.keys(data).length > 0,
//     {
//       message: "At least one field must be updated",
//     }
//   );

// Link between product and attribute (which attributes a product uses)
export const ProductOnAttributeSchema = z.object({
  productId: cuidSchema,
  attributeId: z.number().int(),
});

export const ProductOnAttributeCreateSchema = ProductOnAttributeSchema;
