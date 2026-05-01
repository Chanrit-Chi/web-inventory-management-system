import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import Decimal from "decimal.js";
import {
  PosProduct,
  PosVariant,
  CartItem
} from "../app/(features)/sales/pos/types";
import {
  toNumber,
  extractVariantMeta,
  findBestVariant,
  normalizeOptionKey
} from "../app/(features)/sales/pos/utils";
import { useGetProducts } from "@/hooks/useProduct";
import { useGetCategories } from "@/hooks/useCategory";
import { useGetCustomers } from "@/hooks/useCustomer";
import { useGetPaymentMethods } from "@/hooks/usePaymentMethod";
import { useSaleMutations } from "@/hooks/useSale";
import { Product, OrderWithDetails } from "@/schemas/type-export.schema";
import { lookupVariantByCode, normalizeScannedCode } from "@/lib/barcode-scan";

export function usePos() {
  const [search, setSearch] = useState("");
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
  const [amountPaid, setAmountPaid] = useState<number | null>(null);

  // API Hooks
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

  // Memos
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

  // Handlers
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
      (!hasSizeDimension || currentSizeKey) &&
      (!hasColorDimension || colorKey);

    if (isCompleteSelection) {
      const variant = findBestVariant(product.variants, currentSizeKey, colorKey);
      if (variant) {
        selectVariant(product.id, variant.variantId);
      }
    } else {
      setSelectedVariantByProduct((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    }
  };

  const addToCart = (product: PosProduct) => {
    const selectedId = selectedVariantByProduct[product.id];
    const selectedVariant = product.variants.find((v) => v.variantId === selectedId);

    if (!selectedVariant) {
      toast.error("Please select a variant first");
      return;
    }

    if (selectedVariant.stock <= 0) {
      toast.error("Out of stock");
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product.id && item.variantId === selectedVariant.variantId,
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + 1;
        if (newQty > selectedVariant.stock) {
          toast.error("Cannot exceed available stock");
          return prev;
        }
        next[existingIndex] = { ...next[existingIndex], quantity: newQty };
        return next;
      }

      const labels: string[] = [];
      if (selectedVariant.sizeLabel) labels.push(selectedVariant.sizeLabel);
      if (selectedVariant.colorLabel) labels.push(selectedVariant.colorLabel);
      const variantLabel = labels.length > 0 ? labels.join(" / ") : "Default";

      return [
        ...prev,
        {
          productId: product.id,
          variantId: selectedVariant.variantId,
          name: product.name,
          variantLabel,
          price: selectedVariant.price,
          quantity: 1,
          stock: selectedVariant.stock,
          image: product.image,
        },
      ];
    });
  };

  const changeQty = (productId: string, variantId: number, delta: number) => {
    setCart((prev) => {
      const index = prev.findIndex(
        (item) => item.productId === productId && item.variantId === variantId,
      );
      if (index === -1) return prev;

      const next = [...prev];
      const newQty = next[index].quantity + delta;

      if (newQty <= 0) {
        return prev.filter(
          (item) => item.productId !== productId || item.variantId !== variantId,
        );
      }

      if (newQty > next[index].stock) {
        toast.error("Cannot exceed available stock");
        return prev;
      }

      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  const handleBarcodeScan = async (code: string) => {
    const normalized = normalizeScannedCode(code);
    const variant = await lookupVariantByCode<any>(normalized);

    if (!variant || !variant.product) {
      toast.error(`No product found for code: ${normalized}`);
      return;
    }

    const { product } = variant;
    const { sizeKey, sizeLabel, colorKey, colorLabel, colorHex } =
      extractVariantMeta(variant);
    const sellingPrice = toNumber(variant.sellingPrice);
    const costPrice = toNumber(variant.costPrice);

    const posVariant: PosVariant = {
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

    if (posVariant.stock <= 0) {
      toast.error("Out of stock");
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.variantId === posVariant.variantId,
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + 1;
        if (newQty > posVariant.stock) {
          toast.error("Cannot exceed available stock");
          return prev;
        }
        next[existingIndex] = { ...next[existingIndex], quantity: newQty };
        return next;
      }

      const labels: string[] = [];
      if (posVariant.sizeLabel) labels.push(posVariant.sizeLabel);
      if (posVariant.colorLabel) labels.push(posVariant.colorLabel);
      const variantLabel = labels.length > 0 ? labels.join(" / ") : "Default";

      return [
        ...prev,
        {
          productId: product.id!,
          variantId: posVariant.variantId,
          name: product.name!,
          variantLabel,
          price: posVariant.price,
          quantity: 1,
          stock: posVariant.stock,
          image: product.image || undefined,
        },
      ];
    });
    toast.success(`Added ${product.name}`);
  };

  const checkout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!paymentMethodId) {
      toast.error("Please select a payment method");
      return;
    }

    const payload: OrderWithDetails = {
      customerId: customerId,
      paymentMethodId,
      status,
      totalPrice: new Decimal(total),
      discountPercent,
      discountAmount: new Decimal(discountAmount),
      taxPercent,
      taxAmount: new Decimal(taxAmount),
      amountPaid: amountPaid !== null ? amountPaid : total,
      orderDetails: cart.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: new Decimal(item.price),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addSale.mutate(payload, {
      onSuccess: () => {
        toast.success("Sale completed successfully");
        setCart([]);
        setDiscountPercent(0);
        setTaxPercent(0);
        setAmountPaid(null);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to complete sale");
      },
    });
  };

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    selectedVariantByProduct,
    selectedSizeByProduct,
    selectedColorByProduct,
    cart,
    setCart,
    customerId,
    setCustomerId,
    paymentMethodId,
    setPaymentMethodId,
    status,
    setStatus,
    discountPercent,
    setDiscountPercent,
    taxPercent,
    setTaxPercent,
    amountPaid,
    setAmountPaid,
    loadingProducts,
    loadingCustomers,
    loadingPaymentMethods,
    customers,
    categoryTabs,
    filteredProducts,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    paymentMethods,
    addSale,
    selectSize,
    selectColor,
    selectVariant,
    addToCart,
    changeQty,
    handleBarcodeScan,
    checkout,
  };
}
