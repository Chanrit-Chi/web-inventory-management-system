import { Product } from "@/schemas/type-export.schema";
import { PosVariant, VariantOption, DEFAULT_VARIANT_KEY } from "./types";

export const normalizeOptionKey = (value: string) => value.trim().toLowerCase();

export const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber?: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
};

export const extractVariantMeta = (variant: Product["variants"][number]) => {
  let sizeKey: string | null = null;
  let sizeLabel: string | null = null;
  let colorKey: string | null = null;
  let colorLabel: string | null = null;
  let colorHex: string | undefined;

  for (const attribute of variant.attributes ?? []) {
    const attrValue = attribute.value;
    if (!attrValue || typeof attrValue === "string") continue;

    const name = attrValue.attribute?.name?.toLowerCase() ?? "";
    const rawValue = attrValue.value?.trim() || "";
    if (!rawValue) continue;
    const displayValue =
      (typeof attrValue.displayValue === "string" &&
        attrValue.displayValue.trim()) ||
      rawValue;

    if (name.includes("size")) {
      sizeKey = normalizeOptionKey(rawValue);
      sizeLabel = displayValue;
    }

    if (name.includes("color") || name.includes("colour")) {
      colorKey = normalizeOptionKey(rawValue);
      colorLabel = displayValue;
      colorHex =
        typeof attrValue.colorHex === "string" && attrValue.colorHex.trim()
          ? attrValue.colorHex
          : undefined;
    }
  }

  return { sizeKey, sizeLabel, colorKey, colorLabel, colorHex };
};

export const getVariantSizeKey = (variant: PosVariant) =>
  variant.sizeKey ?? DEFAULT_VARIANT_KEY;

export const getVariantColorKey = (variant: PosVariant) =>
  variant.colorKey ?? DEFAULT_VARIANT_KEY;

export const hasSizeOrColor = (variant: PosVariant) =>
  Boolean(variant.sizeLabel || variant.colorLabel);

export const getVariantChipLabel = (variant: PosVariant) => {
  if (!hasSizeOrColor(variant)) {
    return `Default (${variant.stock})`;
  }

  const size = variant.sizeLabel ?? "-";
  const color = variant.colorLabel ?? "-";
  return `${size}/${color} (${variant.stock})`;
};

export const getVariantLineLabel = (variant: PosVariant) => {
  const labels: string[] = [];
  if (variant.sizeLabel) labels.push(variant.sizeLabel);
  if (variant.colorLabel) labels.push(variant.colorLabel);
  return labels.length > 0 ? labels.join(" / ") : "Default variant";
};

export const getSizeOptions = (variants: PosVariant[]): VariantOption[] => {
  const map = new Map<string, VariantOption>();

  for (const variant of variants) {
    if (!variant.sizeKey || !variant.sizeLabel) continue;
    if (!map.has(variant.sizeKey)) {
      map.set(variant.sizeKey, {
        key: variant.sizeKey,
        label: variant.sizeLabel,
      });
    }
  }

  return Array.from(map.values());
};

export const getColorOptions = (variants: PosVariant[]): VariantOption[] => {
  const map = new Map<string, VariantOption>();

  for (const variant of variants) {
    if (!variant.colorKey || !variant.colorLabel) continue;
    if (!map.has(variant.colorKey)) {
      map.set(variant.colorKey, {
        key: variant.colorKey,
        label: variant.colorLabel,
        colorHex: variant.colorHex,
      });
    }
  }

  return Array.from(map.values());
};

export const findBestVariant = (
  variants: PosVariant[],
  sizeKey?: string,
  colorKey?: string,
) => {
  const matchBySelection = variants.find((variant) => {
    const isSizeMatch = !sizeKey || getVariantSizeKey(variant) === sizeKey;
    const isColorMatch = !colorKey || getVariantColorKey(variant) === colorKey;
    return isSizeMatch && isColorMatch && variant.stock > 0;
  });

  if (matchBySelection) return matchBySelection;

  return variants.find((variant) => variant.stock > 0) || variants[0];
};

export const isSizeDisabled = (
  variants: PosVariant[],
  sizeKey: string,
  selectedColor?: string,
) => {
  return !variants.some((variant) => {
    const sizeMatch = getVariantSizeKey(variant) === sizeKey;
    const colorMatch =
      !selectedColor || getVariantColorKey(variant) === selectedColor;
    return sizeMatch && colorMatch && variant.stock > 0;
  });
};

export const isColorDisabled = (
  variants: PosVariant[],
  colorKey: string,
  selectedSize?: string,
) => {
  return !variants.some((variant) => {
    const colorMatch = getVariantColorKey(variant) === colorKey;
    const sizeMatch =
      !selectedSize || getVariantSizeKey(variant) === selectedSize;
    return colorMatch && sizeMatch && variant.stock > 0;
  });
};
