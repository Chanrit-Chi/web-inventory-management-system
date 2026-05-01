"use client";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import {
  AttributeSelection,
  ProductVariant,
} from "@/schemas/type-export.schema";
import { Info } from "lucide-react";
import { Decimal } from "decimal.js";
import { cartesianProduct } from "@/utils/cartesianProduct";
import { SingleProductForm } from "./single-product-form";
import { VariantDefaultsForm } from "./variant-defaults-form";
import { AttributeSelector, Attribute } from "./attribute-selector";
import { VariantsTable } from "./variants-table";
import { ProductFormValues } from "./product-form";

// Types for attribute selection
interface AttributeSelectionState {
  id: string;
  attributeId: number | null;
  selectedValueIds: number[];
}

export function VariantForm() {
  const { watch, setValue } = useFormContext<ProductFormValues>();

  const productType = watch("productType");
  const [selectedAttributes, setSelectedAttributes] = useState<
    AttributeSelectionState[]
  >([]);
  const [defaultPrices, setDefaultPrices] = useState({
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    reservedStock: 0,
    reorderLevel: 0,
  });

  const productSku = watch("sku") || "";
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(true);

  useEffect(() => {
    async function fetchAttributes() {
      setLoadingAttributes(true);
      const res = await fetch("/api/products/attributes");
      const data = await res.json();
      setAttributes(data);
      setLoadingAttributes(false);

      // Initialize state from form values if editing
      const initialType =
        watch("attributeSelections")?.length > 0 ? "variable" : "single";
      setValue("productType", initialType);

      const initialSelections = watch("attributeSelections");
      if (initialSelections && initialSelections.length > 0) {
        setSelectedAttributes(
          initialSelections.map((sel) => ({
            id: Math.random().toString(36).substring(7),
            attributeId: sel.attributeId,
            selectedValueIds:
              sel.selectedValueIds || sel.values?.map((v) => v.id) || [],
          })),
        );
      }
    }
    fetchAttributes();
  }, [watch, setSelectedAttributes, setValue]); // Include watch and setValue to react to initialData load

  // Compute variants whenever selections change
  const computedVariants = useMemo(() => {
    if (productType !== "variable") return [];

    const validSelections = selectedAttributes.filter(
      (attr) => attr.attributeId && attr.selectedValueIds.length > 0,
    );

    if (validSelections.length === 0 || !productSku) return [];

    const attributeValueCombinations = validSelections.map((selection) => {
      const attribute = attributes.find((a) => a.id === selection.attributeId);
      if (!attribute) return [];

      return selection.selectedValueIds.map((valueId) => {
        const value = attribute.values.find((v) => v.id === valueId);
        return {
          attributeId: selection.attributeId!,
          attributeName: attribute.name,
          valueId,
          value: value?.value || "",
          displayValue: value?.displayValue || value?.value || "",
        };
      });
    });

    const combinations = cartesianProduct(attributeValueCombinations);

    return combinations.map((combination) => {
      const skuSuffix = combination
        .map((attr) => attr.value.toUpperCase().replaceAll(/\s+/g, "-"))
        .join("-");

      return {
        sku: `${productSku}-${skuSuffix}`,
        barcode: "",
        variantName: combination.map((attr) => attr.displayValue).join(" / "),
        costPrice: defaultPrices.costPrice,
        sellingPrice: defaultPrices.sellingPrice,
        stock: defaultPrices.stock,
        reservedStock: defaultPrices.reservedStock ?? 0,
        reorderLevel: defaultPrices.reorderLevel,
        attributes: combination.map((attr) => ({
          attributeName: attr.attributeName,
          value: attr.value,
          valueId: attr.valueId,
        })),
      };
    });
  }, [selectedAttributes, productSku, defaultPrices, productType, attributes]);

  // Sync computed variants with form
  useEffect(() => {
    if (productType === "variable") {
      if (computedVariants.length > 0) {
        const currentFormVariants = watch("variants") || [];

        const variantsForForm = computedVariants.map((v) => {
          // Match existing variant by attribute combination instead of just SKU.
          // This ensures variants keep their data even if their SKU was customized.
          const existing = currentFormVariants.find((ev) => {
            if (!ev.attributes || ev.attributes.length !== v.attributes.length) {
              return ev.sku === v.sku;
            }

            const evValueIds = [...ev.attributes]
              .map((a: { valueId?: number | null }) => a.valueId)
              .filter((id) => id != null)
              .sort();
            const computedValueIds = [...v.attributes]
              .map((a) => a.valueId)
              .sort();

            if (evValueIds.length !== computedValueIds.length) return false;

            return evValueIds.every((id, index) => id === computedValueIds[index]);
          });

          return {
            id: existing?.id,
            sku: existing?.sku ?? v.sku, // Prefer existing SKU if it was customized
            barcode: existing?.barcode ?? null,
            costPrice: existing ? existing.costPrice : new Decimal(v.costPrice),
            sellingPrice: existing
              ? existing.sellingPrice
              : new Decimal(v.sellingPrice),
            stock: existing ? existing.stock : v.stock,
            isActive: existing ? existing.isActive !== false : true,
            reservedStock: existing ? existing.reservedStock : v.reservedStock,
            reorderLevel: existing ? existing.reorderLevel : v.reorderLevel,
            attributes: v.attributes.map((a) => ({ valueId: a.valueId })),
            productId: existing?.productId ?? "",
          };
        }) as ProductVariant[];

        setValue("variants", variantsForForm);
      }
    }

    const validSelections = selectedAttributes.filter(
      (attr) => attr.attributeId && attr.selectedValueIds.length > 0,
    );
    const attributeIds = validSelections
      .map((s) => s.attributeId)
      .filter((id): id is number => id !== null);
    setValue("productAttributes", attributeIds);

    const fullAttributeSelections: AttributeSelection[] = validSelections.map(
      (sel) => {
        const attr = attributes.find((a) => a.id === sel.attributeId);
        return {
          attributeId: sel.attributeId!,
          attributeName: attr?.name || "",
          selectedValueIds: sel.selectedValueIds,
          values: sel.selectedValueIds.map((vid) => {
            const val = attr?.values.find((v) => v.id === vid);
            return { id: vid, value: val?.value || "" };
          }),
        };
      },
    );
    setValue("attributeSelections", fullAttributeSelections);
  }, [
    computedVariants,
    selectedAttributes,
    setValue,
    attributes,
    productType,
    watch,
  ]);

  const updateSingleVariant = (updates: Partial<ProductVariant>) => {
    const currentVariant = watch("variants")?.[0] || {};
    const defaultVariant = {
      id: 0,
      sku: productSku || "DEFAULT-SKU",
      barcode: null,
      costPrice: new Decimal(0),
      sellingPrice: new Decimal(0),
      stock: 0,
      reservedStock: 0,
      reorderLevel: 0,
      attributes: [],
      productId: "",
    };

    setValue("variants", [
      {
        ...defaultVariant,
        ...currentVariant,
        ...updates,
      },
    ]);
  };

  const updateVariantField = (
    index: number,
    field: string,
    value: number | boolean | string,
  ) => {
    const currentVariants = watch("variants") || [];
    const updatedVariants = currentVariants.map((variant, i) => {
      if (i === index) {
        if (field === "costPrice" || field === "sellingPrice") {
          return { ...variant, [field]: new Decimal(value as number) };
        }
        if (field === "barcode") {
          return { ...variant, barcode: (value as string) || null };
        }
        return { ...variant, [field]: value };
      }
      return variant;
    });
    setValue("variants", updatedVariants);
  };

  const availableAttributes = attributes.filter(
    (attr) => !selectedAttributes.some((sel) => sel.attributeId === attr.id),
  );

  const handleProductTypeChange = (type: "single" | "variable") => {
    setValue("productType", type);
    // Data is no longer cleared here to prevent data loss.
    // It will be sanitized on submission in product-form.tsx.
  };

  const addAttribute = () => {
    setSelectedAttributes([
      ...selectedAttributes,
      { id: Date.now().toString(), attributeId: null, selectedValueIds: [] },
    ]);
  };

  const removeAttribute = (id: string) => {
    setSelectedAttributes(selectedAttributes.filter((attr) => attr.id !== id));
  };

  const updateAttributeId = (id: string, attributeId: number) => {
    setSelectedAttributes(
      selectedAttributes.map((attr) =>
        attr.id === id ? { ...attr, attributeId, selectedValueIds: [] } : attr,
      ),
    );
  };

  const toggleValueSelection = (attrId: string, valueId: number) => {
    setSelectedAttributes(
      selectedAttributes.map((attr) => {
        if (attr.id === attrId) {
          const isSelected = attr.selectedValueIds.includes(valueId);
          return {
            ...attr,
            selectedValueIds: isSelected
              ? attr.selectedValueIds.filter((id) => id !== valueId)
              : [...attr.selectedValueIds, valueId],
          };
        }
        return attr;
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Product Type Selection */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Product Type</Label>
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
              onChange={() => handleProductTypeChange("single")}
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
              onChange={() => handleProductTypeChange("variable")}
              className="cursor-pointer accent-primary"
            />
            <span>Variable Product (with variants)</span>
          </Label>
        </div>
      </div>

      {/* Single Product Form */}
      {productType === "single" && (
        <SingleProductForm updateSingleVariant={updateSingleVariant} />
      )}

      {/* Variable Product Form */}
      {productType === "variable" && (
        <div className="space-y-6">
          {/* Info Alert */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-800 dark:text-blue-200">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p>
              Select attributes and their values to automatically generate
              product variants. Each combination will create a unique variant.
            </p>
          </div>

          {/* Default Prices for All Variants */}
          <VariantDefaultsForm
            defaultPrices={defaultPrices}
            setDefaultPrices={setDefaultPrices}
          />

          {/* Attribute Selection */}
          <AttributeSelector
            attributes={attributes}
            selectedAttributes={selectedAttributes}
            availableAttributes={availableAttributes}
            loadingAttributes={loadingAttributes}
            onAddAttribute={addAttribute}
            onRemoveAttribute={removeAttribute}
            onUpdateAttributeId={updateAttributeId}
            onToggleValueSelection={toggleValueSelection}
          />

          {/* Generated Variants Preview */}
          {computedVariants.length > 0 && (
            <VariantsTable
              computedVariants={computedVariants}
              currentVariants={watch("variants") || []}
              onUpdateVariantField={updateVariantField}
            />
          )}

          {selectedAttributes.length > 0 && computedVariants.length === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center text-sm text-yellow-800 dark:text-yellow-200">
              Select at least one value for each attribute to generate variants
            </div>
          )}
        </div>
      )}
    </div>
  );
}
