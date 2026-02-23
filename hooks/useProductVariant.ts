import { productVariantApiService } from "@/lib/services/client/productVariantApiServince";
import { useQuery } from "@tanstack/react-query";

export const useGetProductVariantBySku = (sku: string) =>
  useQuery({
    queryKey: ["productVariant", sku],
    queryFn: () => productVariantApiService.fetchVariantBySku(sku),
  });

export const useGetProductVariantById = (id: number) =>
  useQuery({
    queryKey: ["productVariant", id],
    queryFn: () => productVariantApiService.fetchVariantById(id),
  });

export const useGetProductVariantsByProductId = (
  productId: string,
  page?: number,
  limit?: number,
) =>
  useQuery({
    queryKey: ["productVariants", productId, page, limit],
    queryFn: () => productVariantApiService.fetchVariantsByProduct(productId),
  });
