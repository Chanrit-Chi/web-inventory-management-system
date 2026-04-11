"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Decimal from "decimal.js";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  UserPlus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetProducts } from "@/hooks/useProduct";
import { usePermission } from "@/hooks/usePermission";
import { useGetCategories } from "@/hooks/useCategory";
import { useGetCustomers } from "@/hooks/useCustomer";
import { useGetPaymentMethods } from "@/hooks/usePaymentMethod";
import { useSaleMutations } from "@/hooks/useSale";
import { lookupVariantByCode, normalizeScannedCode } from "@/lib/barcode-scan";
import { usePhysicalBarcodeScanner } from "@/hooks/usePhysicalBarcodeScanner";
import { CreateCustomerDialog } from "../../customer/customer-dialogs";
import type { OrderWithDetails, Product } from "@/schemas/type-export.schema";

type PosVariant = {
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

type PosProduct = {
  id: string;
  name: string;
  categoryId: number;
  image?: string;
  variants: PosVariant[];
};

type CartItem = {
  productId: string;
  variantId: number;
  name: string;
  variantLabel: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
};

type LookupVariant = {
  id?: number;
  sku?: string;
  barcode?: string | null;
  stock?: number;
  sellingPrice?: unknown;
  costPrice?: unknown;
  product?: {
    id?: string;
    name?: string;
    image?: string | null;
  };
  attributes?: Array<{
    value?: {
      attribute?: { name?: string | null };
      value?: string | null;
    };
  }>;
};

type VariantOption = {
  key: string;
  label: string;
  colorHex?: string;
};

const DEFAULT_VARIANT_KEY = "__default__";

const normalizeOptionKey = (value: string) => value.trim().toLowerCase();

const toNumber = (value: unknown): number => {
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

const extractVariantMeta = (variant: Product["variants"][number]) => {
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

const getVariantSizeKey = (variant: PosVariant) =>
  variant.sizeKey ?? DEFAULT_VARIANT_KEY;

const getVariantColorKey = (variant: PosVariant) =>
  variant.colorKey ?? DEFAULT_VARIANT_KEY;

const hasSizeOrColor = (variant: PosVariant) =>
  Boolean(variant.sizeLabel || variant.colorLabel);

const getVariantChipLabel = (variant: PosVariant) => {
  if (!hasSizeOrColor(variant)) {
    return `Default (${variant.stock})`;
  }

  const size = variant.sizeLabel ?? "-";
  const color = variant.colorLabel ?? "-";
  return `${size}/${color} (${variant.stock})`;
};

const getVariantLineLabel = (variant: PosVariant) => {
  const labels: string[] = [];
  if (variant.sizeLabel) labels.push(`Size: ${variant.sizeLabel}`);
  if (variant.colorLabel) labels.push(`Color: ${variant.colorLabel}`);
  return labels.length > 0 ? labels.join(" · ") : "Default variant";
};

const getSizeOptions = (variants: PosVariant[]): VariantOption[] => {
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

const getColorOptions = (variants: PosVariant[]): VariantOption[] => {
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

const findBestVariant = (
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

const isSizeDisabled = (
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

const isColorDisabled = (
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

function PosPageContent() {
  const [search, setSearch] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const didAutoFocusRef = useRef(false);
  const isProcessingRef = useRef(false); // prevents concurrent scan submissions
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<
    Record<string, number>
  >({});
  const [selectedSizeByProduct, setSelectedSizeByProduct] = useState<
    Record<string, string | undefined>
  >({});
  const [selectedColorByProduct, setSelectedColorByProduct] = useState<
    Record<string, string | undefined>
  >({});

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [status, setStatus] = useState<"COMPLETED" | "PENDING" | "CANCELLED">(
    "COMPLETED",
  );
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [openCreateCustomer, setOpenCreateCustomer] = useState(false);

  const { data: productsResponse, isLoading: loadingProducts } = useGetProducts(
    1,
    200,
    search || undefined,
    { isActive: "true" },
  );
  const { data: customers, isLoading: loadingCustomers } = useGetCustomers();
  const { data: categories } = useGetCategories();
  const { data: paymentMethods, isLoading: loadingPaymentMethods } =
    useGetPaymentMethods();
  const { addSale } = useSaleMutations();
  const { can, isPending: permissionPending } = usePermission();
  const canUseScanner = !permissionPending && can("barcode:read");

  useEffect(() => {
    if (!canUseScanner || didAutoFocusRef.current) return;
    barcodeInputRef.current?.focus();
    didAutoFocusRef.current = true;
  }, [canUseScanner]);

  const products = useMemo<PosProduct[]>(() => {
    const rows =
      (productsResponse as { data?: Product[] } | undefined)?.data ?? [];

    return rows.map((product) => {
      const variants: PosVariant[] = (product.variants ?? [])
        .filter((variant) => variant.isActive)
        .map((variant) => {
          const { sizeKey, sizeLabel, colorKey, colorLabel, colorHex } =
            extractVariantMeta(variant);
          const sellingPrice = toNumber(variant.sellingPrice);
          const costPrice = toNumber(variant.costPrice);
          return {
            variantId: variant.id ?? 0,
            sku: variant.sku,
            sizeKey,
            sizeLabel,
            colorKey,
            colorLabel,
            colorHex,
            stock: variant.stock ?? 0,
            price: sellingPrice > 0 ? sellingPrice : costPrice,
          };
        })
        .filter((variant) => variant.variantId > 0);

      return {
        id: product.id,
        name: product.name,
        categoryId: product.categoryId,
        image: product.image || undefined,
        variants,
      };
    });
  }, [productsResponse]);

  const categoryTabs = useMemo(
    () => [
      { id: "all", name: "All Products" },
      ...((categories ?? []).map((category) => ({
        id: String(category.id),
        name: category.name,
      })) as Array<{ id: string; name: string }>),
    ],
    [categories],
  );

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;

    const categoryId = Number(selectedCategory);
    if (Number.isNaN(categoryId)) return products;

    return products.filter((product) => product.categoryId === categoryId);
  }, [products, selectedCategory]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  const discountAmount = useMemo(
    () => (subtotal * discountPercent) / 100,
    [subtotal, discountPercent],
  );
  const taxAmount = useMemo(
    () => ((subtotal - discountAmount) * taxPercent) / 100,
    [subtotal, discountAmount, taxPercent],
  );
  const total = useMemo(
    () => subtotal - discountAmount + taxAmount,
    [subtotal, discountAmount, taxAmount],
  );

  const selectVariant = (productId: string, variantId: number) => {
    setSelectedVariantByProduct((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  };

  const selectSize = (product: PosProduct, sizeKey: string) => {
    setSelectedSizeByProduct((prev) => ({ ...prev, [product.id]: sizeKey }));

    const currentColorKey = selectedColorByProduct[product.id];

    const hasSizeDimension = product.variants.some((v) => v.sizeKey);
    const hasColorDimension = product.variants.some((v) => v.colorKey);

    const isCompleteSelection =
      (!hasColorDimension || currentColorKey) &&
      (!hasSizeDimension || sizeKey);

    if (isCompleteSelection) {
      const variant = findBestVariant(product.variants, sizeKey, currentColorKey);
      if (variant) {
        selectVariant(product.id, variant.variantId);
      }
    } else {
      // Clear variant selection if incomplete
      setSelectedVariantByProduct((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  const selectColor = (product: PosProduct, colorKey: string) => {
    setSelectedColorByProduct((prev) => ({ ...prev, [product.id]: colorKey }));

    const currentSizeKey = selectedSizeByProduct[product.id];

    const hasSizeDimension = product.variants.some((v) => v.sizeKey);
    const hasColorDimension = product.variants.some((v) => v.colorKey);

    const isCompleteSelection =
      (!hasColorDimension || colorKey) &&
      (!hasSizeDimension || currentSizeKey);

    if (isCompleteSelection) {
      const variant = findBestVariant(product.variants, currentSizeKey, colorKey);
      if (variant) {
        selectVariant(product.id, variant.variantId);
      }
    } else {
      // Clear variant selection if incomplete
      setSelectedVariantByProduct((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  const addToCart = (product: PosProduct) => {
    if (product.variants.length === 0) {
      toast.error("This product has no variant configured");
      return;
    }

    const selectedId = selectedVariantByProduct[product.id];
    const selectedVariant = product.variants.find(
      (variant) => variant.variantId === selectedId,
    );

    if (!selectedVariant) {
      toast.error("Please select an option (size/color)");
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.variantId === selectedVariant.variantId,
      );

      if (idx >= 0) {
        const updated = [...prev];
        const item = updated[idx];
        if (item.quantity >= item.stock) {
          toast.error(`Maximum stock is ${item.stock}`);
          return prev;
        }
        updated[idx] = {
          ...item,
          quantity: item.quantity + 1,
        };
        return updated;
      }

      const label = getVariantLineLabel(selectedVariant);

      return [
        ...prev,
        {
          productId: product.id,
          variantId: selectedVariant.variantId,
          name: product.name,
          variantLabel: label,
          price: selectedVariant.price,
          quantity: 1,
          stock: selectedVariant.stock,
          image: product.image,
        },
      ];
    });
  };

  const changeQty = (productId: string, variantId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId || item.variantId !== variantId) {
            return item;
          }

          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.stock) {
            toast.error(`Maximum stock is ${item.stock}`);
            return item;
          }

          return { ...item, quantity: nextQty };
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const mapLookupVariantLabel = (variant: LookupVariant) => {
    const labels =
      variant.attributes
        ?.map((attr) => {
          const name = attr.value?.attribute?.name;
          const value = attr.value?.value;
          if (!name || !value) return null;
          return `${name}: ${value}`;
        })
        .filter((item): item is string => Boolean(item)) ?? [];

    return labels.length > 0 ? labels.join(" · ") : "Default variant";
  };

  const addLookupVariantToCart = (variant: LookupVariant) => {
    if (!variant.id || !variant.product?.id || !variant.product?.name) {
      toast.error("Unable to map scanned variant to product");
      return;
    }

    const stock = variant.stock ?? 0;
    if (stock <= 0) {
      toast.error("This variant is out of stock");
      return;
    }

    const sellingPrice = toNumber(variant.sellingPrice);
    const costPrice = toNumber(variant.costPrice);
    const price = sellingPrice > 0 ? sellingPrice : costPrice;
    const variantLabel = mapLookupVariantLabel(variant);

    const productId = variant.product.id;
    const variantId = variant.id;
    const productName = variant.product.name;
    const productImage = variant.product.image || undefined;

    setCart((prev) => {
      const idx = prev.findIndex(
        (item) => item.productId === productId && item.variantId === variantId,
      );

      if (idx >= 0) {
        const updated = [...prev];
        const item = updated[idx];

        if (item.quantity >= item.stock) {
          toast.error(`Maximum stock is ${item.stock}`);
          return prev;
        }

        updated[idx] = {
          ...item,
          quantity: item.quantity + 1,
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId,
          variantId,
          name: productName,
          variantLabel,
          price,
          quantity: 1,
          stock,
          image: productImage,
        },
      ];
    });

    toast.success("Scanned product added");
  };

  const submitBarcodeLookup = async (rawCode: string) => {
    if (!canUseScanner) {
      toast.error("You do not have permission to use barcode scanner");
      return;
    }
    // Lock: prevent concurrent submissions (double-scan guard)
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const code = normalizeScannedCode(rawCode);
    if (!code) {
      isProcessingRef.current = false;
      return;
    }

    setIsScanning(true);
    try {
      const variant = await lookupVariantByCode<LookupVariant>(code);

      if (!variant) {
        toast.error("No product variant found for scanned code");
        return;
      }

      addLookupVariantToCart(variant);
      // Clear the barcode input via DOM ref (input is uncontrolled)
      if (barcodeInputRef.current) barcodeInputRef.current.value = "";
      barcodeInputRef.current?.focus();
    } finally {
      setIsScanning(false);
      // Release lock after a short delay so rapid re-scans still work
      setTimeout(() => { isProcessingRef.current = false; }, 300);
    }
  };

  // Physical HID barcode scanner — listens at document level.
  // Placed AFTER submitBarcodeLookup so the closure is always current.
  usePhysicalBarcodeScanner({
    onScan: (code) => {
      void submitBarcodeLookup(code);
    },
    enabled: canUseScanner,
    inputRef: barcodeInputRef,
    keepFocus: true,
  });

  const checkout = () => {
    if (!customerId || !paymentMethodId || cart.length === 0) {
      toast.error("Please select customer, payment method, and add items");
      return;
    }

    const payload: OrderWithDetails = {
      customerId,
      status,
      paymentMethodId,
      totalPrice: new Decimal(total),
      discountPercent,
      discountAmount: new Decimal(discountAmount),
      taxPercent,
      taxAmount: new Decimal(taxAmount),
      orderDetails: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: new Decimal(item.price),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const toastId = toast.loading("Processing sale...");
    addSale.mutate(payload, {
      onSuccess: () => {
        toast.success("Sale completed", { id: toastId });
        setCart([]);
        setDiscountPercent(0);
        setTaxPercent(0);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to complete sale", {
          id: toastId,
        });
      },
    });
  };

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShoppingCart className="size-6 text-primary" /> Point of Sale
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 xl:items-start">
        <div className="xl:col-span-3 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9 w-full"
                  placeholder="Search products..."
                />
              </div>
            </div>

            {canUseScanner && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-52 sm:max-w-sm">
                  <Input
                    ref={barcodeInputRef}
                    defaultValue=""
                    placeholder="Scan barcode or SKU"
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const val = barcodeInputRef.current?.value?.trim() ?? "";
                      if (val) {
                        if (barcodeInputRef.current) barcodeInputRef.current.value = "";
                        void submitBarcodeLookup(val);
                      }
                    }}
                    disabled={isScanning}
                  >
                    {isScanning ? "..." : "Scan"}
                  </Button>
                </div>
              </div>
            )}

            {!permissionPending && !canUseScanner && (
              <p className="text-xs text-muted-foreground">
                You don&apos;t have permission (`barcode:read`) to use scanner
                controls.
              </p>
            )}
          </div>

          {loadingProducts ? (
            <p className="text-sm text-muted-foreground">Loading products...</p>
          ) : (
            <>
              <div className="border rounded-xl p-1 flex gap-1 overflow-x-auto scrollbar-hide">
                {categoryTabs.map((tab) => {
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-card border border-border shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const hasVariants = product.variants.length > 0;
                  const hasSizeDimension = product.variants.some(
                    (variant) => variant.sizeKey,
                  );
                  const hasColorDimension = product.variants.some(
                    (variant) => variant.colorKey,
                  );
                  const hasAnySizeOrColor =
                    hasSizeDimension || hasColorDimension;
                  const sizeOptions = getSizeOptions(product.variants);
                  const colorOptions = getColorOptions(product.variants);
                  const selectedId = selectedVariantByProduct[product.id];
                  const selectedSizeKey = selectedSizeByProduct[product.id];
                  const selectedColorKey = selectedColorByProduct[product.id];
                  const selectedVariant = product.variants.find(
                    (v) => v.variantId === selectedId,
                  );

                  return (
                    <div
                      key={product.id}
                      className="border rounded-xl p-3 bg-card flex h-full flex-col gap-3"
                    >
                      <div className="h-40 rounded-lg bg-muted overflow-hidden relative">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="font-semibold line-clamp-2">
                          {product.name}
                        </p>
                        {hasVariants && selectedVariant ? (
                          <p className="text-sm text-primary font-bold">
                            ${selectedVariant.price.toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-sm text-amber-600 font-medium">
                            Select an option
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {hasAnySizeOrColor
                            ? "Available size/color"
                            : "Available option"}
                        </p>
                        {hasVariants ? (
                          <div className="space-y-2">
                            {hasSizeDimension && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground">
                                  Size
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {sizeOptions.map((size) => {
                                    const disabled = isSizeDisabled(
                                      product.variants,
                                      size.key,
                                      hasColorDimension
                                        ? selectedColorKey
                                        : undefined,
                                    );
                                    const isSelected =
                                      selectedSizeKey === size.key;
                                    return (
                                      <button
                                        key={size.key}
                                        type="button"
                                        onClick={() =>
                                          selectSize(product, size.key)
                                        }
                                        disabled={disabled}
                                        className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${
                                          isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10 font-bold"
                                            : disabled
                                              ? "bg-muted/30 text-muted-foreground/40 border-muted-foreground/5 cursor-not-allowed"
                                              : "bg-background/50 text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                                        }`}
                                      >
                                        {isSelected && <Check className="size-3" />}
                                        {size.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {hasColorDimension && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground">
                                  Color
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {colorOptions.map((color) => {
                                    const disabled = isColorDisabled(
                                      product.variants,
                                      color.key,
                                      hasSizeDimension
                                        ? selectedSizeKey
                                        : undefined,
                                    );
                                    const isSelected =
                                      selectedColorKey === color.key;                                     return (
                                      <button
                                        key={color.key}
                                        type="button"
                                        onClick={() =>
                                          selectColor(product, color.key)
                                        }
                                        disabled={disabled}
                                        className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all duration-200 inline-flex items-center gap-2 ${
                                          isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10 font-bold"
                                            : disabled
                                              ? "bg-muted/30 text-muted-foreground/40 border-muted-foreground/5 cursor-not-allowed"
                                              : "bg-background/50 text-muted-foreground border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                                        }`}
                                      >
                                        <div className="relative">
                                          <span
                                            className="block size-3 rounded-full border border-black/10"
                                            style={
                                              color.colorHex
                                                ? {
                                                    backgroundColor:
                                                      color.colorHex,
                                                  }
                                                : undefined
                                            }
                                          />
                                          {isSelected && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <Check className="size-2 text-primary-foreground drop-shadow-sm" />
                                            </div>
                                          )}
                                        </div>
                                        <span>{color.label}</span>
                                      </button>
                                    );

                                  })}
                                </div>
                              </div>
                            )}

                            {!hasAnySizeOrColor && (
                              <div className="flex flex-wrap gap-1">
                                {product.variants.map((variant) => (
                                  <button
                                    key={variant.variantId}
                                    type="button"
                                    onClick={() =>
                                      selectVariant(
                                        product.id,
                                        variant.variantId,
                                      )
                                    }
                                    className={`text-[10px] px-2 py-1 rounded-full border ${
                                      selectedVariant?.variantId ===
                                      variant.variantId
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-background hover:bg-accent"
                                    }`}
                                  >
                                    {getVariantChipLabel(variant)}
                                  </button>
                                ))}
                              </div>
                            )}
                             <p className="text-[10px] text-muted-foreground pt-1">
                               Selected: {selectedVariant ? (
                                 <span className="text-primary font-bold">{getVariantChipLabel(selectedVariant)}</span>
                               ) : "None"}
                             </p>
                           </div>
                        ) : (
                          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-max">
                            No variants available
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full mt-auto"
                        onClick={() => addToCart(product)}
                        disabled={!selectedVariant}
                        variant={selectedVariant ? "default" : "outline"}
                      >
                        <Plus className="size-4 mr-1" /> Add to Cart
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4 self-start pr-1 xl:fixed xl:right-6 xl:top-20 xl:w-[20rem] xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          <Button asChild variant="outline" className="w-full">
            <Link href="/sales/all-sale">
              <ArrowLeft className="size-4 mr-1" /> Back to Sale
            </Link>
          </Button>

          <div className="border rounded-xl p-4 bg-card space-y-3">
            <div>
              <Label>Customer</Label>
              <div className="flex gap-2 mt-1">
                <Select value={customerId ?? ""} onValueChange={setCustomerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Customer</SelectLabel>
                      {loadingCustomers ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        (customers || []).map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => setOpenCreateCustomer(true)}
                >
                  <UserPlus className="size-4" />
                </Button>
                <CreateCustomerDialog
                  open={openCreateCustomer}
                  onOpenChange={setOpenCreateCustomer}
                  onSuccess={(customer) => setCustomerId(customer.id)}
                />
              </div>
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select
                value={paymentMethodId ? String(paymentMethodId) : ""}
                onValueChange={(value) => setPaymentMethodId(Number(value))}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Payment Method</SelectLabel>
                    {loadingPaymentMethods ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      (paymentMethods || []).map((method) => (
                        <SelectItem key={method.id} value={String(method.id)}>
                          {method.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as "COMPLETED" | "PENDING" | "CANCELLED")
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-card space-y-3">
            <h2 className="font-semibold">Cart</h2>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {cart.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No items in cart
                </p>
              )}
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="border rounded-lg p-2"
                >
                  <div className="flex justify-between">
                    <div className="flex items-start gap-2">
                      <div className="relative size-12 rounded-md overflow-hidden bg-muted shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.variantLabel}
                        </p>
                        <p className="text-sm font-semibold">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          changeQty(item.productId, item.variantId, -1)
                        }
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="text-sm w-5 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-7"
                        onClick={() =>
                          changeQty(item.productId, item.variantId, 1)
                        }
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Discount %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(event) =>
                      setDiscountPercent(Number(event.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Tax %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(event) =>
                      setTaxPercent(Number(event.target.value) || 0)
                    }
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={checkout}
              disabled={addSale.isPending || cart.length === 0}
            >
              {addSale.isPending ? "Processing..." : "Process Transaction"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PosPage() {
  return <PosPageContent />;
}
