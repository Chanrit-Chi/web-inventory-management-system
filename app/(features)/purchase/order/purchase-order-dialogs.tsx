"use client";

import { toast } from "sonner";
import { ConfirmDialog, BaseDialog } from "@/components/dialog-template";
import { Button } from "@/components/ui/button";
import { usePurchaseOrderMutations } from "@/hooks/usePurchaseOrder";
import type { PurchaseOrderRow } from "./columns";
import { StatusBadge } from "@/components/StatusBadge";

// ============================================
// View Purchase Order Dialog
// ============================================
interface ViewPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrderRow;
}

export function ViewPurchaseOrderDialog({
  open,
  onOpenChange,
  order,
}: Readonly<ViewPurchaseOrderDialogProps>) {
  const total = Number(order.totalAmount);

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Purchase Order PO-${String(order.id).padStart(4, "0")}`}
      description={`Supplier: ${order.supplier?.name} | Status: ${order.status}`}
      className="sm:max-w-2xl"
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      <div className="py-4 space-y-4">
        {/* Order info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-muted-foreground">Supplier</p>
            <p>{order.supplier?.name}</p>
            <p className="text-xs text-muted-foreground">
              {order.supplier?.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.supplier?.phone}
            </p>
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">Order Info</p>
            <p className="flex items-center gap-2">
              Status: <StatusBadge status={order.status} />
            </p>
            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Line items */}
        <div>
          <h3 className="font-semibold mb-2">Items</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-right px-3 py-2">Qty</th>
                  <th className="text-right px-3 py-2">Unit Price</th>
                  <th className="text-right px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.purchaseOrderDetails.map((detail) => {
                  const attributeLabel = detail.variant?.attributes
                    ?.map((a) => `${a.value.attribute.name}: ${a.value.value}`)
                    .join(", ");
                  return (
                    <tr key={detail.id} className="border-t">
                      <td className="px-3 py-2">
                        <p>{detail.product?.name}</p>
                        {attributeLabel && (
                          <p className="text-xs text-muted-foreground">
                            {attributeLabel}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {detail.variant?.sku}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {detail.quantity}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(detail.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(detail.unitPrice * detail.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted">
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-2 text-right font-semibold"
                  >
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </BaseDialog>
  );
}

// ============================================
// Delete Purchase Order Dialog
// ============================================
interface DeletePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrderRow;
}

export function DeletePurchaseOrderDialog({
  open,
  onOpenChange,
  order,
}: Readonly<DeletePurchaseOrderDialogProps>) {
  const { deletePurchaseOrder } = usePurchaseOrderMutations();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Purchase Order"
      description={`Are you sure you want to delete PO-${String(order.id).padStart(4, "0")}? This action cannot be undone.`}
      item={order}
      renderItem={(o) => (
        <div className="rounded-lg bg-muted p-4 space-y-1">
          <p className="font-medium">
            PO-{String(o.id).padStart(4, "0")} — {o.supplier?.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Status: {o.status} | Items: {o.purchaseOrderDetails.length}
          </p>
          {o.status === "COMPLETED" && (
            <p className="text-sm text-amber-600 font-medium">
              Warning: Deleting a completed order will revert the stock changes.
            </p>
          )}
        </div>
      )}
      confirmLabel="Delete"
      confirmVariant="destructive"
      isLoading={deletePurchaseOrder.isPending}
      onConfirm={async () => {
        deletePurchaseOrder.mutate(order.id, {
          onSuccess: () => {
            toast.success("Purchase order deleted successfully");
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error(err.message);
          },
        });
      }}
    />
  );
}
