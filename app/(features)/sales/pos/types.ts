export type PosVariant = {
  variantId: number;
  sku: string;
  sizeKey: string | null;
  sizeLabel: string | null;
  colorKey: string | null;
  colorLabel: string | null;
  colorHex?: string;
  stock: number;
  price: number;
};

export type PosProduct = {
  id: string;
  name: string;
  categoryId: number;
  image?: string;
  variants: PosVariant[];
};

export type CartItem = {
  productId: string;
  variantId: number;
  name: string;
  variantLabel: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
};

export type VariantOption = {
  key: string;
  label: string;
  colorHex?: string;
};

export const DEFAULT_VARIANT_KEY = "__default__";
