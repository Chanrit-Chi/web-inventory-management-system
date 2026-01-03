import { z } from "zod";

export const ProductAttributeSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1, "Attribute name is required"),
});

export const ProductAttributeCreateSchema = ProductAttributeSchema.omit({
  id: true,
});

export const ProductVariantAttributeSchema = z.object({
  id: z.number().int(),
  variantId: z.number().int(),
  attributeId: z.number().int(),
  value: z.string().min(1, "Attribute value is required"),
});

export const ProductVariantAttributeCreateSchema =
  ProductVariantAttributeSchema.omit({
    id: true,
  });
