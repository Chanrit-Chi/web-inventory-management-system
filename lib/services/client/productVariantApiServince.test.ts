import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { productVariantApiService } from "@/lib/services/client/productVariantApiServince";

describe("productVariantApiService lookup paths", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("calls SKU lookup endpoint with encoded value", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    await productVariantApiService.fetchVariantBySku("SKU/001");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products/variants/sku/SKU%2F001",
    );
  });

  it("calls barcode lookup endpoint with encoded value", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 2 }),
    });

    await productVariantApiService.fetchVariantByBarcode("88 5100 0001");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/products/variants/barcode/88%205100%200001",
    );
  });
});
