import { FormField } from "@/components/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormContext, useFieldArray, Control } from "react-hook-form";
import { ProductWithVariantsCommand } from "@/schemas/commands/product-with-variants.command";
import { getZeroDecimal } from "@/utils/decimal";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";

type Attribute = {
  readonly id: number;
  readonly name: string;
};

type AttributeFieldProps = {
  readonly attr: Attribute;
  readonly variantIndex: number;
  readonly control: Control<ProductWithVariantsCommand>;
};

function AttributeField({ attr, variantIndex, control }: AttributeFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${variantIndex}.attributes`,
  });

  return (
    <FormField key={attr.id} label={attr.name}>
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder={`${attr.name} Value ID`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const input = e.target as HTMLInputElement;
              const valueId = Number(input.value);
              if (!Number.isNaN(valueId) && valueId > 0) {
                append({ valueId });
                input.value = "";
              }
            }
          }}
          className="flex-1"
        />
      </div>
      {fields.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              <span>ID: {field.valueId}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="ml-1 hover:text-blue-900"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </FormField>
  );
}

export function VariantForm({
  attributes,
}: {
  readonly attributes: Attribute[];
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProductWithVariantsCommand>();

  const {
    fields: variants,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(
    new Set(),
  );

  const toggleVariant = (index: number) => {
    setExpandedVariants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAddVariant = () => {
    const newIndex = variants.length;
    append({
      sku: "",
      productId: "",
      costPrice: getZeroDecimal(),
      sellingPrice: getZeroDecimal(),
      stock: 0,
      reservedStock: 0,
      reorderLevel: 0,
      attributes: [],
    });
    setExpandedVariants((prev) => new Set(prev).add(newIndex));
  };

  const handleRemoveVariant = (index: number) => {
    if (confirm("Are you sure you want to remove this variant?")) {
      remove(index);
      setExpandedVariants((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        // Adjust indices for remaining variants
        const adjustedSet = new Set<number>();
        newSet.forEach((idx) => {
          if (idx > index) {
            adjustedSet.add(idx - 1);
          } else if (idx < index) {
            adjustedSet.add(idx);
          }
        });
        return adjustedSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleAddVariant}
        variant="outline"
        className="w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Variant
      </Button>

      {variants.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
          <p className="text-sm">No variants added yet</p>
          <p className="text-xs mt-1">
            Click &quot;Add Variant&quot; to create your first variant
          </p>
        </div>
      )}

      {variants.map((variant, vIdx) => {
        const isExpanded = expandedVariants.has(vIdx);
        const variantErrors = errors.variants?.[vIdx];
        const hasVariantErrors =
          variantErrors && Object.keys(variantErrors).length > 0;

        return (
          <div
            key={variant.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              hasVariantErrors ? "border-red-300 bg-red-50" : "bg-white"
            }`}
          >
            {/* Variant Header */}
            <div
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleVariant(vIdx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleVariant(vIdx);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isExpanded}
              aria-controls={`variant-content-${vIdx}`}
            >
              <div className="flex items-center gap-3">
                <strong className="text-base">Variant {vIdx + 1}</strong>
                {hasVariantErrors && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Has errors
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveVariant(vIdx);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <svg
                  className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Variant Content */}
            {isExpanded && (
              <div className="p-4 pt-0 border-t" id={`variant-content-${vIdx}`}>
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    label="SKU"
                    required
                    error={variantErrors?.sku?.message}
                  >
                    <Input
                      {...register(`variants.${vIdx}.sku`)}
                      placeholder="e.g., VAR-001"
                      className={variantErrors?.sku ? "border-red-500" : ""}
                    />
                  </FormField>

                  <FormField
                    label="Cost Price"
                    required
                    error={variantErrors?.costPrice?.message}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${vIdx}.costPrice`, {
                        valueAsNumber: true,
                      })}
                      placeholder="0.00"
                      className={
                        variantErrors?.costPrice ? "border-red-500" : ""
                      }
                    />
                  </FormField>

                  <FormField
                    label="Selling Price"
                    required
                    error={variantErrors?.sellingPrice?.message}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${vIdx}.sellingPrice`, {
                        valueAsNumber: true,
                      })}
                      placeholder="0.00"
                      className={
                        variantErrors?.sellingPrice ? "border-red-500" : ""
                      }
                    />
                  </FormField>

                  <FormField
                    label="Stock Quantity"
                    error={variantErrors?.stock?.message}
                  >
                    <Input
                      type="number"
                      {...register(`variants.${vIdx}.stock`, {
                        valueAsNumber: true,
                      })}
                      placeholder="0"
                      className={variantErrors?.stock ? "border-red-500" : ""}
                    />
                  </FormField>

                  <FormField
                    label="Reserved Stock"
                    error={variantErrors?.reservedStock?.message}
                  >
                    <Input
                      type="number"
                      {...register(`variants.${vIdx}.reservedStock`, {
                        valueAsNumber: true,
                      })}
                      placeholder="0"
                      className={
                        variantErrors?.reservedStock ? "border-red-500" : ""
                      }
                    />
                  </FormField>

                  <FormField
                    label="Reorder Level"
                    error={variantErrors?.reorderLevel?.message}
                  >
                    <Input
                      type="number"
                      {...register(`variants.${vIdx}.reorderLevel`, {
                        valueAsNumber: true,
                      })}
                      placeholder="0"
                      className={
                        variantErrors?.reorderLevel ? "border-red-500" : ""
                      }
                    />
                  </FormField>
                </div>

                {/* Attributes Section */}
                {attributes.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-3 text-sm text-gray-700">
                      Attribute Values
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {attributes.map((attr) => (
                        <AttributeField
                          key={attr.id}
                          attr={attr}
                          variantIndex={vIdx}
                          control={control}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Press Enter to add attribute value IDs
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
