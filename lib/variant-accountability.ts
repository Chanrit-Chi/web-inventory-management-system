export type AccountableVariant = {
  sku: string;
  barcode?: string | null;
  costPrice?: unknown;
  sellingPrice?: unknown;
  stock?: unknown;
  isActive?: boolean;
  reservedStock?: unknown;
  reorderLevel?: unknown;
  attributes?: Array<{ valueId: number }>;
};

export function ensureAccountableVariants<T extends AccountableVariant>(
  variants: T[] | undefined,
  fallbackSku: string,
): Array<
  T & {
    barcode: string | null;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    isActive: boolean;
    reservedStock: number;
    reorderLevel: number;
    attributes: Array<{ valueId: number }>;
  }
> {
  if (variants && variants.length > 0) {
    return variants.map((variant) => ({
      ...variant,
      barcode: (variant.barcode ?? null) || null,
      costPrice: Number(variant.costPrice ?? 0),
      sellingPrice: Number(variant.sellingPrice ?? 0),
      stock: Number(variant.stock ?? 0),
      isActive: variant.isActive ?? true,
      reservedStock: Number(variant.reservedStock ?? 0),
      reorderLevel: Number(variant.reorderLevel ?? 0),
      attributes: variant.attributes ?? [],
    }));
  }

  return [
    {
      sku: fallbackSku,
      barcode: null,
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      isActive: true,
      reservedStock: 0,
      reorderLevel: 0,
      attributes: [],
    } as unknown as T & {
      barcode: string | null;
      costPrice: number;
      sellingPrice: number;
      stock: number;
      isActive: boolean;
      reservedStock: number;
      reorderLevel: number;
      attributes: Array<{ valueId: number }>;
    },
  ];
}
