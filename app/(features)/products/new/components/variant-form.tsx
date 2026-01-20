import { FormField } from "@/components/FormField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductVariantWithAttributes } from "@/schemas/type-export.schema";
import { useFormContext } from "react-hook-form";
import { useState } from "react";

export function VariantForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ProductVariantWithAttributes>();

  const [productType, setProductType] = useState<"single" | "variable">(
    "single",
  );

  return (
    <div className="space-y-4">
      {/* Product Type Selection - UI only, not stored */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Label
          htmlFor="single"
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="radio"
            id="single"
            name="product-type"
            value="single"
            checked={productType === "single"}
            onChange={() => setProductType("single")}
            className="cursor-pointer accent-primary"
          />
          <span>Single Product</span>
        </Label>
        <Label
          htmlFor="variable"
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="radio"
            id="variable"
            name="product-type"
            value="variable"
            checked={productType === "variable"}
            onChange={() => setProductType("variable")}
            className="cursor-pointer accent-primary"
          />
          <span>Variable Product</span>
        </Label>
      </div>

      {/* Conditional Form Fields */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {productType === "single" && (
          <div>
            <FormField
              label="Cost Price"
              required
              error={errors.costPrice?.message}
            >
              <Input type="number" {...register("costPrice")} />
            </FormField>

            <FormField
              label="Selling Price"
              required
              error={errors.sellingPrice?.message}
            >
              <Input type="number" {...register("sellingPrice")} />
            </FormField>
          </div>
        )}

        {productType === "variable" && (
          <div>
            <FormField label="SKU" required error={errors.sku?.message}>
              <Input type="text" {...register("sku")} />
            </FormField>
          </div>
        )}
      </div>
    </div>
  );
}
