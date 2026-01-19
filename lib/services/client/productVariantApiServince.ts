import { ProductVariantWithAttributesSchema } from "@/schemas/complex.schema";
import {
  ProductVariant,
  ProductVariantCreate,
} from "@/schemas/type-export.schema";

export const productVariantApiService = {
  createVariant: async (
    variant: ProductVariantCreate
  ): Promise<ProductVariant> => {
    const validateProductVariant =
      ProductVariantWithAttributesSchema.parse(variant);
    const payload = {
      ...validateProductVariant,
      attributes: validateProductVariant.attributes || [],
    };

    const res = await fetch(`/api/products/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to create product variant" }));
      throw new Error(errorData.error || "Failed to create product variant");
    }

    return res.json();
  },
};
