import { z } from "zod";
import { ProductCreateSchema } from "../product.schema";
import { VariantCreateCommandSchema } from "./variant-create.command";

export const ProductWithVariantsCommandSchema = ProductCreateSchema.extend({
  attributeIds: z.array(z.number().int()).optional(),
  variants: z
    .array(VariantCreateCommandSchema)
    .min(1, "At least one variant is required"),
});

export type ProductWithVariantsCommand = z.infer<
  typeof ProductWithVariantsCommandSchema
>;
