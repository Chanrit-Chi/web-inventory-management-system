"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

import { StockMovementWithRelations } from "@/schemas/type-export.schema";

export const columns: ColumnDef<StockMovementWithRelations>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy HH:mm")}
        </div>
      );
    },
  },
  {
    accessorKey: "variant.product.name",
    header: "Product",
    cell: ({ row }) => {
      const variant = row.original.variant;
      const product = variant?.product;
      return <div className="font-medium text-sm">{product?.name || "N/A"}</div>;
    },
  },
  {
    accessorKey: "variant.sku",
    header: "SKU",
    cell: ({ row }) => (
      <div className="text-sm font-mono">{row.original.variant?.sku ?? "—"}</div>
    ),
  },
  {
    accessorKey: "movementType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("movementType") as string;

      const styleMap: Record<string, string> = {
        INITIAL:    "bg-blue-50   text-blue-700   border-blue-200",
        SALE:       "bg-red-50    text-red-700    border-red-200",
        PURCHASE:   "bg-green-50  text-green-700  border-green-200",
        ADJUSTMENT: "bg-amber-50  text-amber-700  border-amber-200",
        RETURN:     "bg-purple-50 text-purple-700 border-purple-200",
        DAMAGE:     "bg-orange-50 text-orange-700 border-orange-200",
      };

      const style = styleMap[type] ?? "bg-muted text-muted-foreground border-border";

      return (
        <Badge variant="outline" className={`capitalize text-xs font-medium border ${style}`}>
          {type.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Qty Change",
    cell: ({ row }) => {
      const qty = row.getValue("quantity") as number;
      const isPositive = qty > 0;
      return (
        <div
          className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
        >
          {isPositive ? "+" : ""}
          {qty}
        </div>
      );
    },
  },
  {
    accessorKey: "previousStock",
    header: "Prev Stock",
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("previousStock")}</div>
    ),
  },
  {
    accessorKey: "newStock",
    header: "New Stock",
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("newStock")}</div>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.getValue("reason") as string | null;
      return (
        <div className="text-sm max-w-50 truncate" title={reason ?? ""}>
          {reason || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Adjusted By",
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("createdBy") || "—"}</div>
    ),
  },
];
