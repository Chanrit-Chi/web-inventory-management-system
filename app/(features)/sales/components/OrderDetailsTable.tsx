import { Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepperInput } from "@/components/ui/stepper-input";
import Image from "next/image";

export interface SaleOrderDetail {
  productId: string;
  variantId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  stock?: number;
  image?: string;
}

interface OrderDetailsTableProps {
  orderDetails: SaleOrderDetail[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveProduct: (index: number) => void;
}

export const OrderDetailsTable = ({
  orderDetails,
  onUpdateQuantity,
  onRemoveProduct,
}: OrderDetailsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-2 font-semibold">Product</th>
            <th className="text-right py-3 px-2 font-semibold">Price</th>
            <th className="text-center py-3 px-2 font-semibold">Quantity</th>
            <th className="text-right py-3 px-2 font-semibold">Subtotal</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {orderDetails.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                No products added yet. Click &quot;Add Product&quot; to start.
              </td>
            </tr>
          ) : (
            orderDetails.map((detail, index) => (
              <tr
                key={`${detail.productId}-${detail.variantId}`}
                className="border-b hover:bg-accent"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    {detail.image && (
                      <div className="relative w-12 h-12 shrink-0 overflow-hidden rounded-md border">
                        <Image
                          src={detail.image}
                          alt={detail.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{detail.productName}</div>
                      {detail.stock !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Available: {detail.stock}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  ${detail.unitPrice.toFixed(2)}
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center w-28">
                      <StepperInput
                        value={detail.quantity}
                        onChange={(e) => {
                          const val = Number.parseInt(e.target.value);
                          if (!Number.isNaN(val)) {
                            onUpdateQuantity(index, val);
                          } else if (e.target.value === "") {
                            // Allow empty string while typing
                            onUpdateQuantity(index, 0);
                          }
                        }}
                        onBlur={(e) => {
                          const val = Number.parseInt(e.target.value);
                          if (Number.isNaN(val) || val < 1) {
                            onUpdateQuantity(index, 1);
                          }
                        }}
                        min={1}
                        max={detail.stock}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  ${detail.subtotal.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  <button
                    onClick={() => onRemoveProduct(index)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
