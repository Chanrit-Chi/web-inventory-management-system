import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductVariant } from "@/schemas/type-export.schema";

interface ComputedVariant {
  sku: string;
  variantName: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reservedStock: number;
  reorderLevel: number;
}

interface VariantsTableProps {
  readonly computedVariants: ComputedVariant[];
  readonly currentVariants: ProductVariant[];
  readonly onUpdateVariantField: (
    index: number,
    field: string,
    value: number | boolean,
  ) => void;
}

export function VariantsTable({
  computedVariants,
  currentVariants,
  onUpdateVariantField,
}: VariantsTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          Generated Variants ({computedVariants.length})
        </Label>
        <span className="text-sm text-gray-500">
          You can edit prices for each variant
        </span>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Variant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reorder
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reserved
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {computedVariants.map((variant, index) => {
                const currentVariant = currentVariants[index];
                return (
                  <tr key={variant.sku} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {variant.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {variant.variantName}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          currentVariant?.costPrice?.toString() ||
                          variant.costPrice.toString()
                        }
                        onChange={(e) =>
                          onUpdateVariantField(
                            index,
                            "costPrice",
                            Number.parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24 h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          currentVariant?.sellingPrice?.toString() ||
                          variant.sellingPrice.toString()
                        }
                        onChange={(e) =>
                          onUpdateVariantField(
                            index,
                            "sellingPrice",
                            Number.parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24 h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={currentVariant?.stock ?? variant.stock}
                        onChange={(e) =>
                          onUpdateVariantField(
                            index,
                            "stock",
                            Number.parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-24 h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={
                          currentVariant?.reorderLevel ?? variant.reorderLevel
                        }
                        onChange={(e) =>
                          onUpdateVariantField(
                            index,
                            "reorderLevel",
                            Number.parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-24 h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={
                          currentVariant?.reservedStock ?? variant.reservedStock
                        }
                        onChange={(e) =>
                          onUpdateVariantField(
                            index,
                            "reservedStock",
                            Number.parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-24 h-8 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={currentVariant?.isActive !== false}
                        onChange={(e) =>
                          onUpdateVariantField(
                            index,
                            "isActive",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
