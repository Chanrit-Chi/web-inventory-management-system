/* eslint-disable react/no-unescaped-entities */
import { Trash2 } from "lucide-react";

interface SaleOrderDetail {
  productId: string;
  variantId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
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
                No products added yet. Click "Add Product" to start.
              </td>
            </tr>
          ) : (
            orderDetails.map((detail, index) => (
              <tr key={index} className="border-b hover:bg-accent">
                <td className="py-3 px-2">{detail.productName}</td>
                <td className="py-3 px-2 text-right">
                  ${detail.unitPrice.toFixed(2)}
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    value={detail.quantity}
                    onChange={(e) =>
                      onUpdateQuantity(index, Number(e.target.value))
                    }
                    min="1"
                    className="w-20 mx-auto px-2 py-1 border rounded text-center outline-none focus:ring-2 bg-background"
                  />
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  ${detail.subtotal.toFixed(2)}
                </td>
                <td className="py-3 px-2">
                  <button
                    onClick={() => onRemoveProduct(index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
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
