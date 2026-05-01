import React from "react";

interface DocumentItem {
  id?: string | number;
  description: string;
  sku?: string | null;
  price: number;
  quantity: number;
  total: number;
}

interface DocumentTableProps {
  readonly items: DocumentItem[];
}

export function DocumentTable({ items }: DocumentTableProps) {
  return (
    <div className="mb-8">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-primary text-primary-foreground text-print-white">
              <th className="px-6 py-4 text-left text-sm font-semibold">
                Description
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold">
                Price
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold">
                Qty
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <tr
                key={item.id || index}
                className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 text-sm">
                    {item.description}
                  </div>
                  {item.sku && (
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      SKU: {item.sku}
                    </div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm text-slate-700">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm text-slate-700">
                  {item.quantity}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-900">
                  ${item.total.toFixed(2)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  No items in this document
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
