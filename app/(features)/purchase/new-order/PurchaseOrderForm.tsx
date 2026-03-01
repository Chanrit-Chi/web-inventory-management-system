"use client";

import { useState } from "react";
import {
  Search,
  Trash2,
  Package,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import { useGetProducts } from "@/hooks/useProduct";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================
export interface ProductSearchResult {
  id: string;
  name: string;
  image?: string | null;
  variants: Array<{
    id: number;
    sku: string;
    stock: number;
    costPrice: unknown;
    attributes: Array<{
      value: {
        value: string;
        attribute?: { name: string };
      };
    }>;
  }>;
}

function extractCostPrice(costPrice: unknown): number {
  if (costPrice === null || costPrice === undefined) return 0;
  if (typeof costPrice === "number") return costPrice;
  if (
    typeof costPrice === "object" &&
    costPrice !== null &&
    "toNumber" in costPrice &&
    typeof (costPrice as { toNumber: unknown }).toNumber === "function"
  ) {
    return (costPrice as { toNumber: () => number }).toNumber();
  }
  if (typeof costPrice === "string") return Number.parseFloat(costPrice) || 0;
  return 0;
}

// ============================================
// Product Selection Dialog
// ============================================
interface ProductSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => void;
  selectedVariantIds: number[];
}

function ProductSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  selectedVariantIds,
}: Readonly<ProductSelectionDialogProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingVariants, setPendingVariants] = useState<
    Array<{
      product: ProductSearchResult;
      variant: ProductSearchResult["variants"][0];
    }>
  >([]);

  const { data: searchResponse, isLoading: isSearching } = useGetProducts(
    1,
    10,
    searchQuery || undefined,
    { isActive: "true" },
  );

  const handleOpenChange = (val: boolean) => {
    if (!val) setPendingVariants([]);
    onOpenChange(val);
  };

  const isVariantPending = (variantId: number) =>
    pendingVariants.some((p) => p.variant.id === variantId);

  const toggleVariant = (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => {
    if (selectedVariantIds.includes(variant.id)) return;
    if (isVariantPending(variant.id)) {
      setPendingVariants((prev) =>
        prev.filter((p) => p.variant.id !== variant.id),
      );
    } else {
      setPendingVariants((prev) => [...prev, { product, variant }]);
    }
  };

  const toggleAllVariants = (product: ProductSearchResult) => {
    const available = product.variants.filter(
      (v) => !selectedVariantIds.includes(v.id),
    );
    const allPending = available.every((v) => isVariantPending(v.id));
    if (allPending) {
      setPendingVariants((prev) =>
        prev.filter((p) => !available.some((v) => v.id === p.variant.id)),
      );
    } else {
      const toAdd = available
        .filter((v) => !isVariantPending(v.id))
        .map((v) => ({ product, variant: v }));
      setPendingVariants((prev) => [...prev, ...toAdd]);
    }
  };

  const handleConfirm = () => {
    pendingVariants.forEach(({ product, variant }) =>
      onSelect(product, variant),
    );
    setPendingVariants([]);
    onOpenChange(false);
  };

  const renderProductList = () => {
    if (isSearching) {
      return (
        <div className="p-8 text-center">
          <Spinner className="mx-auto" />
        </div>
      );
    }

    if (searchResponse?.data?.length) {
      return (searchResponse.data as ProductSearchResult[]).map((product) => {
        const totalVariants = product.variants.length;
        const addedCount = product.variants.filter((v) =>
          selectedVariantIds.includes(v.id),
        ).length;
        const available = product.variants.filter(
          (v) => !selectedVariantIds.includes(v.id),
        );
        const pendingCount = available.filter((v) =>
          isVariantPending(v.id),
        ).length;
        const allAvailablePending =
          available.length > 0 &&
          available.every((v) => isVariantPending(v.id));
        const someSelected =
          (addedCount > 0 || pendingCount > 0) &&
          addedCount + pendingCount < totalVariants;

        return (
          <div key={product.id} className="p-2 space-y-1">
            {/* Product row */}
            <div className="flex items-center gap-2 px-2 py-1">
              <input
                type="checkbox"
                ref={(el) => {
                  if (el)
                    el.indeterminate = someSelected && !allAvailablePending;
                }}
                checked={allAvailablePending || addedCount === totalVariants}
                onChange={() => toggleAllVariants(product)}
                disabled={addedCount === totalVariants}
                title={
                  addedCount === totalVariants
                    ? "All variants already added"
                    : "Select all variants"
                }
                className="size-3.5 cursor-pointer accent-primary disabled:cursor-default"
              />
              {product.image ? (
                <div className="size-6 relative rounded overflow-hidden border">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="size-6 rounded bg-muted flex items-center justify-center border">
                  <Package className="size-3 text-muted-foreground" />
                </div>
              )}
              <div className="font-semibold text-xs text-primary flex-1">
                {product.name}
              </div>
              {(addedCount > 0 || pendingCount > 0) && (
                <span className="text-[10px] text-muted-foreground">
                  {addedCount + pendingCount}/{totalVariants}
                </span>
              )}
            </div>

            {/* Variant rows */}
            <div className="grid grid-cols-1 gap-1">
              {product.variants.map((variant) => {
                const isAdded = selectedVariantIds.includes(variant.id);
                const isPending = isVariantPending(variant.id);
                const cost = extractCostPrice(variant.costPrice);
                const attrLabel =
                  variant.attributes?.map((a) => a.value?.value).join(" / ") ||
                  "Default";

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => toggleVariant(product, variant)}
                    disabled={isAdded}
                    className={cn(
                      "flex items-center justify-between p-2 hover:bg-accent rounded-md text-sm text-left group disabled:opacity-50",
                      isPending && "bg-primary/10 border border-primary/30",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        SKU: {variant.sku}
                      </span>
                      <span className="text-sm">{attrLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-muted px-1.5 py-0.5 rounded">
                        Stock: {variant.stock}
                      </span>
                      {cost > 0 && (
                        <span className="bg-muted px-1.5 py-0.5 rounded">
                          Cost: ${cost.toFixed(2)}
                        </span>
                      )}
                      {isAdded && (
                        <CheckCircle2 className="size-4 text-green-500" />
                      )}
                      {!isAdded && isPending && (
                        <CheckCircle2 className="size-4 text-primary" />
                      )}
                      {!isAdded && !isPending && (
                        <PlusCircle className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      });
    }

    if (searchQuery) {
      return (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No products found
        </div>
      );
    }

    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Type to search products...
      </div>
    );
  };

  const pendingCount = pendingVariants.length;
  const addButtonLabel =
    pendingCount === 0
      ? "Add Items"
      : `Add ${pendingCount} ${pendingCount === 1 ? "Item" : "Items"}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Select Products</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto rounded-md border divide-y">
            {renderProductList()}
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={pendingCount === 0}>
            {addButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Product Selector (trigger + dialog)
// ============================================
interface ProductSelectorProps {
  selectedVariantIds: number[];
  onSelect: (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => void;
}

export function ProductSelector({
  selectedVariantIds,
  onSelect,
}: ProductSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Order Items</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          Add Products
          <PlusCircle className="size-4" />
        </Button>
      </div>

      <ProductSelectionDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={onSelect}
        selectedVariantIds={selectedVariantIds}
      />
    </>
  );
}

// ============================================
// Order Items Table
// ============================================
export interface PurchaseOrderItem {
  productId: string;
  variantId: number;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  image?: string;
}

interface PurchaseOrderItemsTableProps {
  items: PurchaseOrderItem[];
  onQuantityChange: (variantId: number, qty: number) => void;
  onPriceChange: (variantId: number, price: number) => void;
  onRemove: (variantId: number) => void;
}

export function PurchaseOrderItemsTable({
  items,
  onQuantityChange,
  onPriceChange,
  onRemove,
}: PurchaseOrderItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-10 text-center space-y-3">
        <div className="bg-primary/10 size-12 rounded-full flex items-center justify-center mx-auto">
          <Package className="size-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          No items added yet. Click &quot;Add Products&quot; to start.
        </p>
      </div>
    );
  }

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left px-3 py-2">Product</th>
            <th className="text-right px-3 py-2 w-28">Unit Price ($)</th>
            <th className="text-right px-3 py-2 w-24">Quantity</th>
            <th className="text-right px-3 py-2 w-28">Total</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.variantId} className="border-t">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {item.image ? (
                    <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded border">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-muted size-9 rounded border flex items-center justify-center shrink-0">
                      <Package className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {item.sku}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={item.unitPrice}
                  onChange={(e) =>
                    onPriceChange(
                      item.variantId,
                      Number.parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full text-right border rounded px-2 py-1 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    onQuantityChange(
                      item.variantId,
                      Math.max(1, parseInt(e.target.value) || 1),
                    )
                  }
                  className="w-full text-right border rounded px-2 py-1 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </td>
              <td className="px-3 py-2 text-right font-medium">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  type="button"
                  onClick={() => onRemove(item.variantId)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-muted">
          <tr>
            <td colSpan={3} className="px-3 py-2 text-right font-semibold">
              Total
            </td>
            <td className="px-3 py-2 text-right font-semibold">
              ${total.toFixed(2)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
