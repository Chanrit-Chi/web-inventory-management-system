import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepperInput } from "@/components/ui/stepper-input";
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
    value: number | boolean | string,
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
        <span className="text-sm text-muted-foreground">
          You can edit prices for each variant
        </span>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap min-w-[150px]">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Barcode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Variant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Cost
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Reorder
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Reserved
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                  Active
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {computedVariants.map((variant, index) => {
                const currentVariant = currentVariants[index];
                return (
                  <tr key={variant.sku} className="hover:bg-muted/40">
                    <td className="px-4 py-3 text-sm text-foreground font-mono whitespace-nowrap">
                      {variant.sku}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        value={
                          (currentVariant as { barcode?: string | null })
                            ?.barcode ?? ""
                        }
                        onChange={(e) =>
                          onUpdateVariantField(index, "barcode", e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                          }
                        }}
                        className="w-36 h-8 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {variant.variantName}
                    </td>
                    <td className="px-4 py-3">
                      <StepperInput
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
                        className="w-28 h-8 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StepperInput
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
                        className="w-28 h-8 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StepperInput
                        value={currentVariant?.stock ?? variant.stock}
                        onChange={(e) =>
                          onUpdateVariantField(
                            index,
                            "stock",
                            Number.parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-28 h-8 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StepperInput
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
                        className="w-28 h-8 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StepperInput
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
                        className="w-28 h-8 text-xs"
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
                        className="w-4 h-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
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
