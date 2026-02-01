export interface AttributeSelection {
  attributeId: number;
  attributeName: string;
  selectedValueIds: number[];
  values: Array<{
    id: number;
    value: string;
  }>;
}

export interface VariantGenerationInput {
  productSku: string;
  productId?: string;
  attributeSelections: AttributeSelection[];
  defaultCostPrice?: number;
  defaultSellingPrice?: number;
  defaultStock?: number;
  defaultReorderLevel?: number;
}

export interface GeneratedVariant {
  id: number;
  sku: string;
  productId: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reservedStock: number;
  reorderLevel: number;
  attributes: Array<{
    valueId: number;
  }>;
  variantName: string;
  attributeValues: Array<{
    attributeName: string;
    value: string;
    valueId: number;
  }>;
}

export function generateVariantCombinations(
  input: VariantGenerationInput,
): GeneratedVariant[] {
  const {
    productSku,
    productId = "",
    attributeSelections,
    defaultCostPrice = 0,
    defaultSellingPrice = 0,
    defaultStock = 0,
    defaultReorderLevel = 0,
  } = input;

  // Filter out attributes with no selected values
  const validSelections = attributeSelections.filter(
    (selection) => selection.selectedValueIds.length > 0,
  );

  if (validSelections.length === 0) {
    return [];
  }

  // Build value combinations with full metadata
  const attributeValueCombinations = validSelections.map((selection) => {
    return selection.selectedValueIds.map((valueId) => {
      const valueData = selection.values.find((v) => v.id === valueId);
      return {
        attributeId: selection.attributeId,
        attributeName: selection.attributeName,
        valueId,
        value: valueData?.value || "",
      };
    });
  });

  // Generate Cartesian product
  const combinations = cartesianProduct(attributeValueCombinations);

  // Create variants from combinations
  return combinations.map((combination, index) => {
    // Generate SKU suffix from attribute values
    const skuSuffix = combination
      .map((attr) => attr.value.toUpperCase().replace(/\s+/g, "-"))
      .join("-");

    const sku = `${productSku}-${skuSuffix}`;

    // Generate human-readable name
    const variantName = combination.map((attr) => attr.value).join(" / ");

    return {
      id: index,
      sku,
      productId,
      costPrice: defaultCostPrice,
      sellingPrice: defaultSellingPrice,
      stock: defaultStock,
      reservedStock: 0,
      reorderLevel: defaultReorderLevel,
      attributes: combination.map((attr) => ({
        valueId: attr.valueId,
      })),
      variantName,
      attributeValues: combination.map((attr) => ({
        attributeName: attr.attributeName,
        value: attr.value,
        valueId: attr.valueId,
      })),
    };
  });
}

export function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map((item) => [item]);

  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);

  return first.flatMap((item) => restProduct.map((combo) => [item, ...combo]));
}
