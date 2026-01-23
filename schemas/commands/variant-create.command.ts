import { z } from "zod";
import { ProductVariantCreateSchema } from "../product-variant.schema";

const VariantAttributeInputSchema = z.object({
  valueId: z.number().int(),
});

export const VariantCreateCommandSchema = ProductVariantCreateSchema.extend({
  attributes: z.array(VariantAttributeInputSchema).optional(),
});

export type VariantCreateCommand = z.infer<typeof VariantCreateCommandSchema>;
