"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";
import { saleApiService } from "@/lib/services/client/saleApiService";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import {
  OrderWithRelations,
  OrderDetailWithProduct,
} from "@/schemas/type-export.schema";

interface SaleExportButtonProps {
  readonly search?: string;
  readonly filters?: Record<string, string>;
}

export function SaleExportButton({ search, filters }: SaleExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { role } = usePermission();
  const isAdmin = role === "ADMIN";

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all sales matching current filters (limit 10000 for "all")
      const result = await saleApiService.GetSales(1, 10000, search, filters);
      const sales: OrderWithRelations[] = result.data;

      if (!sales || sales.length === 0) {
        toast.error("No sales found to export");
        return;
      }

      // Flatten data for Excel
      const exportData = sales.map((sale: OrderWithRelations) => {
        const details =
          (sale.orderDetail as unknown as OrderDetailWithProduct[]) || [];
        const itemsSummary = details
          .map(
            (d: OrderDetailWithProduct) =>
              `${d.variant?.sku || "N/A"} (x${d.quantity})`,
          )
          .join(", ");

        const totalCost = isAdmin
          ? details.reduce((sum: number, d: OrderDetailWithProduct) => {
              const cost = (
                d.variant as unknown as { costPrice: number | null }
              )?.costPrice;
              return sum + Number(cost || 0) * d.quantity;
            }, 0)
          : 0;

        const totalPaid = Number(sale.totalPrice || 0);
        const grossProfit = totalPaid - totalCost;

        return {
          "Invoice ID": sale.id,
          Date: new Date(sale.createdAt).toLocaleDateString(),
          Time: new Date(sale.createdAt).toLocaleTimeString(),
          "Customer Name": sale.customer?.name || "Walk-in",
          "Customer Phone": sale.customer?.phone || "—",
          Items: itemsSummary || "—",
          "Payment Method": sale.paymentMethod?.name || "—",
          Status: sale.status,
          Subtotal:
            Number(sale.totalPrice || 0) +
            Number(sale.discountAmount || 0) -
            Number(sale.taxAmount || 0),
          Discount: Number(sale.discountAmount || 0),
          Tax: Number(sale.taxAmount || 0),
          "Total Paid": totalPaid,
          ...(isAdmin
            ? {
                "Total Cost": totalCost,
                "Gross Profit": grossProfit,
                "Profit Margin %":
                  totalPaid > 0
                    ? ((grossProfit / totalPaid) * 100).toFixed(2) + "%"
                    : "0%",
              }
            : {}),
        };
      });

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

      // Auto-size columns
      const maxWidths = exportData.reduce(
        (acc: number[], row: Record<string, unknown>) => {
          Object.keys(row).forEach((key, idx) => {
            const val = String(row[key]);
            acc[idx] = Math.max(acc[idx] || 10, val.length + 2, key.length + 2);
          });
          return acc;
        },
        [] as number[],
      );
      worksheet["!cols"] = maxWidths.map((w: number) => ({ wch: w }));

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Sales_Export_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, filename);
      toast.success("Sales export successful");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export sales");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="size-4" />
      )}
      <span>Export XLSX</span>
    </Button>
  );
}
