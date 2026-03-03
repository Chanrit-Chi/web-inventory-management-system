import { describe, expect, it, vi } from "vitest";
import { lookupVariantByCode, normalizeScannedCode } from "@/lib/barcode-scan";

describe("normalizeScannedCode", () => {
  it("trims whitespace around scanned code", () => {
    expect(normalizeScannedCode("  885100000001  ")).toBe("885100000001");
  });
});

describe("lookupVariantByCode", () => {
  it("uses barcode lookup first", async () => {
    const api = {
      fetchVariantByBarcode: vi.fn().mockResolvedValue({ id: 1 }),
      fetchVariantBySku: vi.fn(),
    };

    const result = await lookupVariantByCode("885100000001", api);

    expect(result).toEqual({ id: 1 });
    expect(api.fetchVariantByBarcode).toHaveBeenCalledWith("885100000001");
    expect(api.fetchVariantBySku).not.toHaveBeenCalled();
  });

  it("falls back to SKU lookup when barcode returns null", async () => {
    const api = {
      fetchVariantByBarcode: vi.fn().mockResolvedValue(null),
      fetchVariantBySku: vi.fn().mockResolvedValue({ id: 2 }),
    };

    const result = await lookupVariantByCode("SKU-RED-M", api);

    expect(result).toEqual({ id: 2 });
    expect(api.fetchVariantByBarcode).toHaveBeenCalledWith("SKU-RED-M");
    expect(api.fetchVariantBySku).toHaveBeenCalledWith("SKU-RED-M");
  });

  it("falls back to SKU when barcode lookup throws", async () => {
    const api = {
      fetchVariantByBarcode: vi.fn().mockRejectedValue(new Error("404")),
      fetchVariantBySku: vi.fn().mockResolvedValue({ id: 3 }),
    };

    const result = await lookupVariantByCode("ABC-001", api);

    expect(result).toEqual({ id: 3 });
    expect(api.fetchVariantBySku).toHaveBeenCalledWith("ABC-001");
  });

  it("returns null for empty code", async () => {
    const api = {
      fetchVariantByBarcode: vi.fn(),
      fetchVariantBySku: vi.fn(),
    };

    const result = await lookupVariantByCode("   ", api);

    expect(result).toBeNull();
    expect(api.fetchVariantByBarcode).not.toHaveBeenCalled();
    expect(api.fetchVariantBySku).not.toHaveBeenCalled();
  });
});
