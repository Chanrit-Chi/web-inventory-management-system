"use client";

import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";
import { productApiService } from "@/lib/services/client/productApiService";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import { ProductWithVariants } from "./product-dialogs";
import type { ProductVariant } from "@/schemas/type-export.schema";

interface VariantAttribute {
  value: {
    attribute: { name: string };
    displayValue?: string | null;
    value?: string | null;
  };
}

interface ProductExportButtonProps {
  readonly search?: string;
  readonly filters?: Record<string, string>;
}

export function ProductExportButton({
  search,
  filters,
}: ProductExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { role } = usePermission();
  const isAdmin = role === "ADMIN";

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all products matching current filters (limit 10000 for "all")
      const result = await productApiService.fetchProducts(
        1,
        10000,
        search,
        filters,
      );
      const products: ProductWithVariants[] = result.data;

      if (!products || products.length === 0) {
        toast.error("No products found to export");
        return;
      }

      // Flatten data for Excel: One row per variant
      const exportData = products.flatMap((product: ProductWithVariants) => {
        const variants = product.variants || [];

        // If no variants, at least export basic info
        if (variants.length === 0) {
          return [
            {
              "Base SKU": product.sku,
              "Product Name": product.name,
              Category: product.category?.name || "—",
              Unit: product.unit || "—",
              Description: product.description || "",
              Status: product.isActive,
              "Variant SKU": "—",
              "Variant Name": "—",
              Barcode: "—",
              Stock: 0,
              "Reserved Stock": 0,
              "Reorder Level": 0,
              ...(isAdmin ? { "Cost Price": 0 } : {}),
              "Selling Price": 0,
            },
          ];
        }

        return variants.map((v: ProductVariant) => {
          // Extract attributes
          const attributes = v.attributes || [];
          const attrObj: Record<string, string> = {};

          const variantNameParts: string[] = [];
          (attributes as unknown as VariantAttribute[]).forEach(
            (attr: VariantAttribute, idx: number) => {
              const attrName = attr.value?.attribute?.name || `Attr ${idx + 1}`;
              const attrValue =
                attr.value?.displayValue || attr.value?.value || "—";
              attrObj[`Attribute ${idx + 1} (${attrName})`] = attrValue;
              if (attr.value?.displayValue || attr.value?.value) {
                variantNameParts.push(
                  attr.value?.displayValue || attr.value?.value || "",
                );
              }
            },
          );

          return {
            "Base SKU": product.sku,
            "Product Name": product.name,
            Category: product.category?.name || "—",
            Unit: product.unit || "—",
            Status: product.isActive,
            "Variant SKU": v.sku,
            "Variant Name": variantNameParts.join(" / ") || "Default",
            Barcode: v.barcode || "—",
            ...attrObj,
            Stock: v.stock || 0,
            "Reserved Stock": v.reservedStock || 0,
            "Reorder Level": v.reorderLevel || 0,
            ...(isAdmin
              ? { "Cost Price": v.costPrice != null ? Number(v.costPrice) : 0 }
              : {}),
            "Selling Price":
              v.sellingPrice != null ? Number(v.sellingPrice) : 0,
          };
        });
      });

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      // Auto-size columns (rough approximation)
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

      // Generate Filename
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Product_Export_${dateStr}.xlsx`;

      // Trigger Download
      XLSX.writeFile(workbook, filename);
      toast.success("Product export successful");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export products");
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
