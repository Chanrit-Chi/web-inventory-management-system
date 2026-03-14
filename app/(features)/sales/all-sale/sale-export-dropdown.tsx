"use client";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saleApiService } from "@/lib/services/client/saleApiService";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import {
  OrderWithRelations,
  OrderDetailWithProduct,
} from "@/schemas/type-export.schema";
import {
  ExportDropdown,
  ExportDateFilters,
} from "@/components/export-dropdown";

interface SaleExportDropdownProps {
  readonly search?: string;
  readonly filters?: Record<string, string>;
}

export function SaleExportDropdown({
  search,
  filters,
}: SaleExportDropdownProps) {
  const { role, can } = usePermission();
  const isAdmin = role === "ADMIN";
  const canExport = can("export:read");

  const fetchSales = async (dateFilters: ExportDateFilters) => {
    const exportFilters = { ...filters, ...dateFilters };
    const result = await saleApiService.GetSales(
      1,
      10000,
      search,
      exportFilters,
    );
    return result.data as OrderWithRelations[];
  };

  const handleXlsxExport = async (dateFilters: ExportDateFilters) => {
    const sales = await fetchSales(dateFilters);

    if (!sales || sales.length === 0) {
      toast.error("No sales found to export");
      return;
    }

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
            const cost = (d.variant as unknown as { costPrice: number | null })
              ?.costPrice;
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");

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
    XLSX.writeFile(workbook, `Sales_Export_${dateStr}.xlsx`);
    toast.success("Sales XLSX exported");
  };

  const handlePdfExport = async (dateFilters: ExportDateFilters) => {
    const sales = await fetchSales(dateFilters);

    if (!sales || sales.length === 0) {
      toast.error("No sales found to generate report");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Sales Performance Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.line(14, 32, pageWidth - 14, 32);

    let totalRevenue = 0;
    let totalCost = 0;

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
    const avgOrder = sales.length > 0 ? totalRevenue / sales.length : 0;

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
    doc.text(sales.length.toString(), 63, 55);
    doc.text(`$${avgOrder.toFixed(2)}`, 108, 55);

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

    autoTable(doc, {
      startY: 75,
      head: [["ID", "Date", "Customer", "Items", "Payment", "Status", "Total"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [76, 175, 80] },
      styles: { fontSize: 8 },
    });

    doc.save(`Sales_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Sales PDF generated");
  };

  return (
    <ExportDropdown
      onXlsxExport={handleXlsxExport}
      onPdfExport={handlePdfExport}
      showDateRange
      disabled={!canExport}
    />
  );
}
