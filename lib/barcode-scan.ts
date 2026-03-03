import { productVariantApiService } from "@/lib/services/client/productVariantApiServince";

export function normalizeScannedCode(raw: string): string {
  return raw.trim();
}

type LookupApi<T> = {
  fetchVariantByBarcode: (barcode: string) => Promise<T | null>;
  fetchVariantBySku: (sku: string) => Promise<T | null>;
};

export async function lookupVariantByCode<T>(
  rawCode: string,
  api: LookupApi<T> = productVariantApiService as LookupApi<T>,
): Promise<T | null> {
  const code = normalizeScannedCode(rawCode);
  if (!code) return null;

  try {
    const byBarcode = await api.fetchVariantByBarcode(code);
    if (byBarcode) return byBarcode;
  } catch {
    // no-op; fallback to SKU
  }

  try {
    return await api.fetchVariantBySku(code);
  } catch {
    return null;
  }
}
