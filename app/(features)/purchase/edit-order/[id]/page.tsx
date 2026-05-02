"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { SharedLayout } from "@/components/shared-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllSuppliers } from "@/hooks/useSupplier";
import {
  usePurchaseOrderMutations,
  useGetPurchaseOrderById,
} from "@/hooks/usePurchaseOrder";
import {
  ProductSelector,
  PurchaseOrderItemsTable,
  type ProductSearchResult,
  type PurchaseOrderItem,
} from "../../new-order/PurchaseOrderForm";
import type { PurchaseOrderDetailRow } from "../../order/columns";

type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";


interface EditFormProps {
  orderId: number;
  initialSupplierId: string;
  initialStatus: OrderStatus;
  initialItems: PurchaseOrderItem[];
}

function EditPurchaseOrderForm({
  orderId,
  initialSupplierId,
  initialStatus,
  initialItems,
}: Readonly<EditFormProps>) {
  const router = useRouter();
  const { data: suppliers, isLoading: suppliersLoading } = useGetAllSuppliers();
  const { updatePurchaseOrder } = usePurchaseOrderMutations();

  const [supplierId, setSupplierId] = useState<string>(initialSupplierId);
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [items, setItems] = useState<PurchaseOrderItem[]>(initialItems);

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
      let cost = 0;
      if (typeof variant.costPrice === "number") {
        cost = variant.costPrice;
      } else if (
        variant.costPrice !== null &&
        variant.costPrice !== undefined &&
        typeof (variant.costPrice as { toNumber?: unknown }).toNumber ===
        "function"
      ) {
        cost = (variant.costPrice as { toNumber: () => number }).toNumber();
      } else {
        cost = Number(variant.costPrice) || 0;
      }
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

    updatePurchaseOrder.mutate(
      {
        id: orderId,
        data: {
          supplierId,
          status,
          totalAmount: Math.round(totalAmount),
          purchaseOrderDetails: items.map((item) => ({
            purchaseOrderId: orderId,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: Math.round(item.unitPrice),
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success("Purchase order updated successfully");
          router.push("/purchase/order");
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  };

  const supplierOptions =
    suppliers && suppliers.length > 0 ? (
      suppliers.map((s) => (
        <SelectItem key={s.id} value={s.id}>
          {s.name}
        </SelectItem>
      ))
    ) : (
      <SelectItem value="_empty" disabled>
        No suppliers found
      </SelectItem>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Order Details */}
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
                    {suppliersLoading ? (
                      <SelectItem value="_loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      supplierOptions
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
                onValueChange={(v) => setStatus(v as OrderStatus)}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
              {status === "CANCELLED" && (
                <p className="text-xs text-red-600">
                  Any previously received stock will be reverted.
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
              updatePurchaseOrder.isPending || !supplierId || items.length === 0
            }
          >
            {updatePurchaseOrder.isPending ? "Saving..." : "Save Changes"}
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
  );
}


function EditPurchaseOrderContent() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

  const { data: order, isLoading: orderLoading } =
    useGetPurchaseOrderById(orderId);

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Purchase order not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push("/purchase/order")}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  if (order.status === "COMPLETED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground font-medium">
          PO-{String(orderId).padStart(4, "0")} is completed and cannot be
          edited.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/purchase/order")}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  const initialItems: PurchaseOrderItem[] = (
    order.purchaseOrderDetails as PurchaseOrderDetailRow[]
  ).map((detail) => {
    const attrLabel =
      detail.variant?.attributes?.map((a) => a.value?.value).join(" / ") || "";
    const displayName = attrLabel
      ? `${detail.product?.name} - ${attrLabel}`
      : detail.product?.name || "";
    return {
      productId: detail.productId,
      variantId: detail.variantId,
      name: displayName,
      sku: detail.variant?.sku || "",
      quantity: detail.quantity,
      unitPrice: Number(detail.unitPrice),
      image: detail.product?.image ?? undefined,
    };
  });

  return (
    <div className="w-full px-2 md:px-4 py-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/purchase/order")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <ShoppingCart className="size-6 text-blue-500" />
        <h1 className="text-2xl font-bold">
          Edit Purchase Order — PO-{String(orderId).padStart(4, "0")}
        </h1>
      </div>

      <EditPurchaseOrderForm
        orderId={orderId}
        initialSupplierId={order.supplierId}
        initialStatus={order.status as OrderStatus}
        initialItems={initialItems}
      />
    </div>
  );
}

export default function EditPurchaseOrderPage() {
  return (
    <SharedLayout>
      <EditPurchaseOrderContent />
    </SharedLayout>
  );
}
