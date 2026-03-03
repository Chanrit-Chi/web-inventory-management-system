import { describe, expect, it } from "vitest";
import { ensureAccountableVariants } from "@/lib/variant-accountability";

describe("ensureAccountableVariants", () => {
  it("creates one default accountable variant when variants are missing", () => {
    const result = ensureAccountableVariants(undefined, "SKU-BASE-001");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sku: "SKU-BASE-001",
      barcode: null,
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      isActive: true,
      reservedStock: 0,
      reorderLevel: 0,
      attributes: [],
    });
  });

  it("normalizes existing variant values and preserves barcode", () => {
    const result = ensureAccountableVariants(
      [
        {
          sku: "V-RED-M",
          barcode: "885100000001",
          costPrice: "10.5",
          sellingPrice: "15",
          stock: "3",
          reservedStock: "1",
          reorderLevel: "2",
          isActive: false,
          attributes: [{ valueId: 10 }],
        },
      ],
      "FALLBACK-SKU",
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      sku: "V-RED-M",
      barcode: "885100000001",
      costPrice: 10.5,
      sellingPrice: 15,
      stock: 3,
      reservedStock: 1,
      reorderLevel: 2,
      isActive: false,
      attributes: [{ valueId: 10 }],
    });
  });
});
