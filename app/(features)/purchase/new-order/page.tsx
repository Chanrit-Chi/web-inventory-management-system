"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { SharedLayout } from "@/components/shared-layout";
import { Button } from "@/components/ui/button";
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
import { useGetAllSuppliers } from "@/hooks/useSupplier";
import { usePurchaseOrderMutations } from "@/hooks/usePurchaseOrder";
import {
  ProductSelector,
  PurchaseOrderItemsTable,
  type ProductSearchResult,
  type PurchaseOrderItem,
} from "./PurchaseOrderForm";

function NewPurchaseOrderContent() {
  const router = useRouter();
  const { data: suppliers, isLoading: suppliersLoading } = useGetAllSuppliers();
  const { addPurchaseOrder } = usePurchaseOrderMutations();

  const [supplierId, setSupplierId] = useState<string>("");
  const [status, setStatus] = useState<"PENDING" | "COMPLETED">("COMPLETED");
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  const handleAddProduct = (
    product: ProductSearchResult,
    variant: ProductSearchResult["variants"][0],
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      const cost =
        typeof variant.costPrice === "number"
          ? variant.costPrice
          : variant.costPrice !== null &&
              variant.costPrice !== undefined &&
              typeof (variant.costPrice as { toNumber?: unknown }).toNumber ===
                "function"
            ? (variant.costPrice as { toNumber: () => number }).toNumber()
            : Number(variant.costPrice) || 0;
      const attrLabel =
        variant.attributes?.map((a) => a.value?.value).join(" / ") || "";
      const displayName = attrLabel
        ? `${product.name} - ${attrLabel}`
        : product.name;
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          name: displayName,
          sku: variant.sku,
          quantity: 1,
          unitPrice: cost,
          image: product.image ?? undefined,
        },
      ];
    });
  };

  const handleQuantityChange = (variantId: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId ? { ...i, quantity: qty } : i,
      ),
    );
  };

  const handlePriceChange = (variantId: number, price: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.variantId === variantId ? { ...i, unitPrice: price } : i,
      ),
    );
  };

  const handleRemoveItem = (variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const handleSubmit = () => {
    if (!supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    addPurchaseOrder.mutate(
      {
        supplierId,
        status,
        totalAmount: Math.round(totalAmount),
        purchaseOrderDetails: items.map((item) => ({
          purchaseOrderId: 0, // will be set by server
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice), // DB stores as Int
        })),
      },
      {
        onSuccess: () => {
          toast.success("Purchase order created successfully");
          router.push("/purchase/order");
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  };

  return (
    <div className="w-full px-2 md:px-4 py-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/purchase/order")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ShoppingCart className="size-6 text-blue-500" />
        <h1 className="text-2xl font-bold">New Purchase Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header */}
          <div className="border rounded-lg p-4 space-y-4">
            <h2 className="font-semibold">Order Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier */}
              <div className="space-y-2">
                <Label htmlFor="supplier">
                  Supplier <span className="text-red-500">*</span>
                </Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger id="supplier" className="w-full">
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Suppliers</SelectLabel>
                      {suppliersLoading ? (
                        <SelectItem value="_loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : suppliers && suppliers.length > 0 ? (
                        suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_empty" disabled>
                          No suppliers found
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as "PENDING" | "COMPLETED")}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {status === "COMPLETED" && (
                  <p className="text-xs text-green-600">
                    Stock will be updated when saved.
                  </p>
                )}
                {status === "PENDING" && (
                  <p className="text-xs text-yellow-600">
                    Stock will not be updated until marked completed.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Search & Items */}
          <div className="border rounded-lg p-4">
            <ProductSelector
              selectedVariantIds={items.map((i) => i.variantId)}
              onSelect={handleAddProduct}
            />
            <PurchaseOrderItemsTable
              items={items}
              onQuantityChange={handleQuantityChange}
              onPriceChange={handlePriceChange}
              onRemove={handleRemoveItem}
            />
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4 space-y-4 sticky top-4">
            <h2 className="font-semibold">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Qty</span>
                <span>{items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={
                addPurchaseOrder.isPending || !supplierId || items.length === 0
              }
            >
              {addPurchaseOrder.isPending
                ? "Creating..."
                : "Create Purchase Order"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/purchase/order")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <SharedLayout>
      <NewPurchaseOrderContent />
    </SharedLayout>
  );
}
