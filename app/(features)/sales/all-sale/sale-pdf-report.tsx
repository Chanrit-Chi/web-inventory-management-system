"use client";

import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { saleApiService } from "@/lib/services/client/saleApiService";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import {
  OrderWithRelations,
  OrderDetailWithProduct,
} from "@/schemas/type-export.schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SalePdfReportButtonProps {
  readonly search?: string;
  readonly filters?: Record<string, string>;
}

export function SalePdfReportButton({
  search,
  filters,
}: SalePdfReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { role } = usePermission();
  const isAdmin = role === "ADMIN";

  const generatePdf = async () => {
    setIsGenerating(true);
    try {
      const result = await saleApiService.GetSales(1, 10000, search, filters);
      const sales: OrderWithRelations[] = result.data;

      if (!sales || sales.length === 0) {
        toast.error("No sales found to generate report");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // 1. Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Sales Performance Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleString();
      doc.text(`Generated on: ${dateStr}`, 14, 28);
      doc.line(14, 32, pageWidth - 14, 32);

      // 2. Statistics Calculations
      let totalRevenue = 0;
      let totalCost = 0;
      const salesCount = sales.length;

      sales.forEach((sale) => {
        totalRevenue += Number(sale.totalPrice || 0);

        if (isAdmin) {
          const details =
            (sale.orderDetail as unknown as OrderDetailWithProduct[]) || [];
          details.forEach((d) => {
            const cost = (d.variant as unknown as { costPrice: number | null })
              ?.costPrice;
            totalCost += Number(cost || 0) * d.quantity;
          });
        }
      });

      const grossProfit = totalRevenue - totalCost;
      const avgOrderValue = salesCount > 0 ? totalRevenue / salesCount : 0;

      // 3. Render Dashboard Boxes
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 38, 40, 25, 2, 2, "F");
      doc.roundedRect(59, 38, 40, 25, 2, 2, "F");
      doc.roundedRect(104, 38, 40, 25, 2, 2, "F");
      if (isAdmin) doc.roundedRect(149, 38, 47, 25, 2, 2, "F");

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("TOTAL REVENUE", 18, 45);
      doc.text("SALES COUNT", 63, 45);
      doc.text("AVG ORDER VALUE", 108, 45);
      if (isAdmin) doc.text("GROSS PROFIT", 153, 45);

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        18,
        55,
      );
      doc.text(salesCount.toString(), 63, 55);
      doc.text(`$${avgOrderValue.toFixed(2)}`, 108, 55);

      if (isAdmin) {
        doc.setTextColor(
          grossProfit >= 0 ? 0 : 200,
          grossProfit >= 0 ? 100 : 0,
          0,
        );
        doc.text(
          `$${grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          153,
          55,
        );
      }

      // 4. Sales Table
      const tableData = sales.map((s) => {
        const details =
          (s.orderDetail as unknown as OrderDetailWithProduct[]) || [];
        const items = details
          .map((d) => `${d.product?.name || "Item"} (x${d.quantity})`)
          .join(", ");

        return [
          s.id.toString(),
          new Date(s.createdAt).toLocaleDateString(),
          s.customer?.name || "Walk-in",
          items.length > 40 ? items.substring(0, 37) + "..." : items,
          s.paymentMethod?.name || "—",
          s.status,
          `$${Number(s.totalPrice || 0).toFixed(2)}`,
        ];
      });

      const head = [
        ["ID", "Date", "Customer", "Items", "Payment", "Status", "Total"],
      ];

      autoTable(doc, {
        startY: 75,
        head: head,
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [76, 175, 80] }, // Green for sales
        styles: { fontSize: 8 },
      });

      doc.save(`Sales_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Sales PDF report generated");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate sales PDF report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={generatePdf}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileText className="size-4" />
      )}
      <span>PDF Report</span>
    </Button>
  );
}
