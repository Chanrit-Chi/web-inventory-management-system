import { ProductVariantWithAttributesSchema } from "@/schemas/complex.schema";
import {
  ProductVariant,
  ProductVariantCreate,
} from "@/schemas/type-export.schema";

export const productVariantApiService = {
  createVariant: async (
    variant: ProductVariantCreate,
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

  fetchVariantBySku: async (sku: string): Promise<ProductVariant | null> => {
    const res = await fetch(
      `/api/products/variants/sku/${encodeURIComponent(sku)}`,
    );

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch product variant" }));
      throw new Error(errorData.error || "Failed to fetch product variant");
    }

    return res.json();
  },

  fetchVariantByBarcode: async (
    barcode: string,
  ): Promise<ProductVariant | null> => {
    const res = await fetch(
      `/api/products/variants/barcode/${encodeURIComponent(barcode)}`,
    );

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch product variant" }));
      throw new Error(errorData.error || "Failed to fetch product variant");
    }

    return res.json();
  },

  fetchVariantById: async (id: number): Promise<ProductVariant | null> => {
    const res = await fetch(`/api/products/variants/${id}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch product variant" }));
      throw new Error(errorData.error || "Failed to fetch product variant");
    }

    return res.json();
  },

  fetchVariantsByProduct: async (
    productId: string,
  ): Promise<{
    data: ProductVariant[];
  }> => {
    const params = new URLSearchParams();

    const queryString = params.toString();
    const url = queryString
      ? `/api/products/${productId}/variants?${queryString}`
      : `/api/products/${productId}/variants`;

    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch product variants" }));
      throw new Error(errorData.error || "Failed to fetch product variants");
    }

    return res.json();
  },
};
