"use client";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { productApiService } from "@/lib/services/client/productApiService";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { ProductWithVariants } from "./product-dialogs";
import {
  ExportDropdown,
  ExportDateFilters,
} from "@/components/export-dropdown";
import { downloadXlsx, downloadPdf } from "@/lib/download";

interface VariantAttribute {
  value: {
    displayValue?: string | null;
    value?: string | null;
  };
}

interface ProductExportDropdownProps {
  readonly search?: string;
  readonly filters?: Record<string, string>;
}

export function ProductExportDropdown({
  search,
  filters,
}: ProductExportDropdownProps) {
  const { role, can } = usePermission();
  const isAdmin = role === "ADMIN";
  const canExport = can("export:read");

  const fetchProducts = async () => {
    const result = await productApiService.fetchProducts(
      1,
      10000,
      search,
      filters,
    );
    return result.data as ProductWithVariants[];
  };

  const getVariantName = (v: { attributes?: unknown[] }): string => {
    const attrs = v.attributes as unknown as VariantAttribute[] | undefined;
    return (
      attrs
        ?.map((a: VariantAttribute) => a.value?.displayValue || a.value?.value)
        .join("/") || "Default"
    );
  };

  const handleXlsxExport = async (_dateFilters: ExportDateFilters) => {
    const products = await fetchProducts();

    if (!products || products.length === 0) {
      toast.error("No products found to export");
      return;
    }

    const attrNames = new Set<string>();
    products.forEach((p) =>
      (p.variants || []).forEach((v) =>
        (
          (v.attributes as unknown as { attribute?: { name?: string } }[]) || []
        ).forEach((a) => {
          if (a.attribute?.name) attrNames.add(a.attribute.name);
        }),
      ),
    );

    const exportData = products.flatMap((p: ProductWithVariants) =>
      (p.variants || []).map((v) => {
        const variantName = getVariantName(v);
        const row: Record<string, unknown> = {
          SKU: v.sku,
          Product: p.name,
          Variant: variantName,
          Category: p.category?.name || "—",
          Unit: p.unit || "—",
          Stock: v.stock || 0,
          "Reorder Level": v.reorderLevel || 0,
          "Reserved Stock": v.reservedStock || 0,
          ...(isAdmin ? { "Cost Price": Number(v.costPrice || 0) } : {}),
          "Selling Price": Number(v.sellingPrice || 0),
          Active: v.isActive ? "Yes" : "No",
        };

        for (const name of attrNames) {
          const attr = (
            v.attributes as unknown as {
              attribute?: { name?: string };
              value?: { displayValue?: string; value?: string };
            }[]
          )?.find((a) => a.attribute?.name === name);
          row[name] = attr?.value?.displayValue || attr?.value?.value || "";
        }

        return row;
      }),
    );

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

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
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    await downloadXlsx(buffer, `Products_Export_${dateStr}.xlsx`);
    toast.success("Products XLSX exported");
  };

  const handlePdfExport = async (_dateFilters: ExportDateFilters) => {
    const products = await fetchProducts();

    if (!products || products.length === 0) {
      toast.error("No products found to generate report");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Inventory Status Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.line(14, 32, pageWidth - 14, 32);

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
        if (isAdmin) totalValue += stock * Number(v.costPrice || 0);
        if (stock < (v.reorderLevel || 10)) lowStockCount++;
      });
    });

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

    const tableData = products.flatMap((p) =>
      (p.variants || []).map((v) => {
        const variantName = getVariantName(v);
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
      }),
    );

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
      head,
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [63, 81, 181] },
      styles: { fontSize: 8 },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const stock = Number.parseInt(data.cell.raw as string);
          const limit = Number.parseInt(data.row.cells[5].raw as string);
          if (stock < limit) {
            data.cell.styles.textColor = [220, 0, 0];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    await downloadPdf(doc.output("arraybuffer"), `Inventory_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF report generated");
  };

  return (
    <ExportDropdown
      onXlsxExport={handleXlsxExport}
      onPdfExport={handlePdfExport}
      disabled={!canExport}
    />
  );
}
