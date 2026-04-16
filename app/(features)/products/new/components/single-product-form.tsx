import { FormField } from "@/components/FormField";
import { Input } from "@/components/ui/input";
import { StepperInput } from "@/components/ui/stepper-input";
import { useFormContext } from "react-hook-form";
import { Decimal } from "decimal.js";
import { ProductFormValues } from "./product-form";
import { ProductVariant } from "@/schemas/type-export.schema";

interface SingleProductFormProps {
  readonly updateSingleVariant: (updates: Partial<ProductVariant>) => void;
}

export function SingleProductForm({
  updateSingleVariant,
}: SingleProductFormProps) {
  const {
    formState: { errors },
    watch,
  } = useFormContext<ProductFormValues>();

  const variant = watch("variants")?.[0] || ({} as Partial<ProductVariant>);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <FormField label="Barcode" error={errors.variants?.[0]?.barcode?.message}>
        <Input
          type="text"
          placeholder="Scan or enter barcode"
          value={variant.barcode ?? ""}
          onChange={(e) => {
            updateSingleVariant({ barcode: e.target.value || null });
          }}
        />
      </FormField>

      <FormField
        label="Cost Price"
        required
        error={errors.variants?.[0]?.costPrice?.message}
      >
        <StepperInput
          step="0.01"
          placeholder="0.00"
          value={
            variant.costPrice ? new Decimal(variant.costPrice).toNumber() : ""
          }
          onChange={(e) => {
            const val = Number.parseFloat(e.target.value) || 0;
            updateSingleVariant({ costPrice: new Decimal(val) });
          }}
        />
      </FormField>

      <FormField
        label="Selling Price"
        required
        error={errors.variants?.[0]?.sellingPrice?.message}
      >
        <StepperInput
          step="0.01"
          placeholder="0.00"
          value={
            variant.sellingPrice
              ? new Decimal(variant.sellingPrice).toNumber()
              : ""
          }
          onChange={(e) => {
            const val = Number.parseFloat(e.target.value) || 0;
            updateSingleVariant({ sellingPrice: new Decimal(val) });
          }}
        />
      </FormField>

      <FormField label="Stock" error={errors.variants?.[0]?.stock?.message}>
        <StepperInput
          placeholder="0"
          value={variant.stock ?? ""}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value) || 0;
            updateSingleVariant({ stock: val });
          }}
        />
      </FormField>

      <FormField
        label="Reserved Stock"
        error={errors.variants?.[0]?.reservedStock?.message}
      >
        <StepperInput
          placeholder="0"
          value={variant.reservedStock ?? ""}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value) || 0;
            updateSingleVariant({ reservedStock: val });
          }}
        />
      </FormField>

      <FormField
        label="Reorder Level"
        error={errors.variants?.[0]?.reorderLevel?.message}
      >
        <StepperInput
          placeholder="0"
          value={variant.reorderLevel ?? ""}
          onChange={(e) => {
            const val = Number.parseInt(e.target.value) || 0;
            updateSingleVariant({ reorderLevel: val });
          }}
        />
      </FormField>

      <div className="flex flex-col justify-end pb-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium h-9 border rounded-md p-2">
          <Input
            type="checkbox"
            checked={variant.isActive !== false}
            onChange={(e) =>
              updateSingleVariant({ isActive: e.target.checked })
            }
            className="w-4 h-4 rounded border-gray-300 focus:ring-primary cursor-pointer"
          />
          <span>Active Status</span>
        </label>
      </div>
    </div>
  );
}
