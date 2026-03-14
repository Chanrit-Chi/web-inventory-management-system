"use client";

import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { productApiService } from "@/lib/services/client/productApiService";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { ProductWithVariants } from "./product-dialogs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VariantAttribute {
  value: {
    displayValue?: string | null;
    value?: string | null;
  };
}

interface ProductPdfReportButtonProps {
  readonly search?: string;
  readonly filters?: Record<string, string>;
}

export function ProductPdfReportButton({
  search,
  filters,
}: ProductPdfReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { role } = usePermission();
  const isAdmin = role === "ADMIN";

  const generatePdf = async () => {
    setIsGenerating(true);
    try {
      const result = await productApiService.fetchProducts(
        1,
        10000,
        search,
        filters,
      );
      const products: ProductWithVariants[] = result.data;

      if (!products || products.length === 0) {
        toast.error("No products found to generate report");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // 1. Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Inventory Status Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const dateStr = new Date().toLocaleString();
      doc.text(`Generated on: ${dateStr}`, 14, 28);
      doc.line(14, 32, pageWidth - 14, 32);

      // 2. Summary Dashboard Calculations
      let totalItems = 0;
      let totalStock = 0;
      let totalValue = 0;
      let lowStockCount = 0;

      products.forEach((p) => {
        const variants = p.variants || [];
        totalItems += variants.length || 1;
        variants.forEach((v) => {
          const stock = v.stock || 0;
          totalStock += stock;
          if (isAdmin) {
            totalValue += stock * Number(v.costPrice || 0);
          }
          if (stock < (v.reorderLevel || 10)) {
            lowStockCount++;
          }
        });
      });

      // 3. Render Dashboard Boxes
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, 38, 40, 25, 2, 2, "F");
      doc.roundedRect(59, 38, 40, 25, 2, 2, "F");
      doc.roundedRect(104, 38, 40, 25, 2, 2, "F");
      if (isAdmin) doc.roundedRect(149, 38, 47, 25, 2, 2, "F");

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("TOTAL VARIANTS", 18, 45);
      doc.text("TOTAL STOCK", 63, 45);
      doc.text("LOW STOCK ITEMS", 108, 45);
      if (isAdmin) doc.text("TOTAL VALUE (COST)", 153, 45);

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(totalItems.toString(), 18, 55);
      doc.text(totalStock.toString(), 63, 55);

      doc.setTextColor(lowStockCount > 0 ? 200 : 0, 0, 0);
      doc.text(lowStockCount.toString(), 108, 55);

      doc.setTextColor(0, 0, 0);
      if (isAdmin) {
        doc.text(
          `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          153,
          55,
        );
      }

      // 4. Products Table
      const tableData = products.flatMap((p) => {
        return (p.variants || []).map((v) => {
          const variantName =
            (v.attributes as unknown as VariantAttribute[])
              ?.map(
                (a: VariantAttribute) =>
                  a.value?.displayValue || a.value?.value,
              )
              .join("/") || "Default";
          return [
            v.sku,
            p.name,
            variantName,
            p.category?.name || "—",
            v.stock?.toString() || "0",
            v.reorderLevel?.toString() || "10",
            isAdmin ? `$${Number(v.costPrice || 0).toFixed(2)}` : "",
            `$${Number(v.sellingPrice || 0).toFixed(2)}`,
          ].filter((val) => val !== "");
        });
      });

      const head = [
        [
          "SKU",
          "Product",
          "Variant",
          "Category",
          "Stock",
          "Limit",
          isAdmin ? "Cost" : null,
          "Price",
        ].filter(Boolean) as string[],
      ];

      autoTable(doc, {
        startY: 75,
        head: head,
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [63, 81, 181] },
        styles: { fontSize: 8 },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 4) {
            const stock = parseInt(data.cell.raw as string);
            const limit = parseInt(data.row.cells[5].raw as string);
            if (stock < limit) {
              data.cell.styles.textColor = [220, 0, 0];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      doc.save(
        `Inventory_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      );
      toast.success("PDF report generated");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF report");
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
