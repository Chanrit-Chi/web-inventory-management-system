import { FormField } from "@/components/FormField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DefaultPrices {
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reservedStock: number;
  reorderLevel: number;
}

interface VariantDefaultsFormProps {
  defaultPrices: DefaultPrices;
  setDefaultPrices: React.Dispatch<React.SetStateAction<DefaultPrices>>;
}

export function VariantDefaultsForm({
  defaultPrices,
  setDefaultPrices,
}: VariantDefaultsFormProps) {
  return (
    <div className="space-y-2">
      <Label className="text-base font-semibold">
        Default Values (applied to all variants)
      </Label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <FormField label="Cost Price">
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={defaultPrices.costPrice === 0 ? "" : defaultPrices.costPrice}
            onChange={(e) => {
              const val = e.target.value;
              setDefaultPrices((prev) => ({
                ...prev,
                costPrice: val === "" ? 0 : Number.parseFloat(val),
              }));
            }}
          />
        </FormField>

        <FormField label="Selling Price">
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={
              defaultPrices.sellingPrice === 0 ? "" : defaultPrices.sellingPrice
            }
            onChange={(e) => {
              const val = e.target.value;
              setDefaultPrices((prev) => ({
                ...prev,
                sellingPrice: val === "" ? 0 : Number.parseFloat(val),
              }));
            }}
          />
        </FormField>

        <FormField label="Stock">
          <Input
            type="number"
            placeholder="0"
            value={defaultPrices.stock}
            onChange={(e) =>
              setDefaultPrices((prev) => ({
                ...prev,
                stock: Number.parseInt(e.target.value) || 0,
              }))
            }
          />
        </FormField>

        <FormField label="Reserved Stock">
          <Input
            type="number"
            placeholder="0"
            value={defaultPrices.reservedStock}
            onChange={(e) =>
              setDefaultPrices((prev) => ({
                ...prev,
                reservedStock: Number.parseInt(e.target.value) || 0,
              }))
            }
          />
        </FormField>

        <FormField label="Reorder Level">
          <Input
            type="number"
            placeholder="0"
            value={defaultPrices.reorderLevel}
            onChange={(e) =>
              setDefaultPrices((prev) => ({
                ...prev,
                reorderLevel: Number.parseInt(e.target.value) || 0,
              }))
            }
          />
        </FormField>
      </div>
    </div>
  );
}
