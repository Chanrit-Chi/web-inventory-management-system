"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { StockMovementType } from "@prisma/client";

import { StockMovementWithRelations } from "@/schemas/type-export.schema";

export const columns: ColumnDef<StockMovementWithRelations>[] = [
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      return format(new Date(row.getValue("createdAt")), "MMM dd, yyyy HH:mm");
    },
  },
  {
    accessorKey: "variant.product.name",
    header: "Product",
    cell: ({ row }) => {
      const variant = row.original.variant;
      const product = variant?.product;
      return <div className="font-medium">{product?.name || "N/A"}</div>;
    },
  },
  {
    accessorKey: "variant.sku",
    header: "SKU",
  },
  {
    accessorKey: "movementType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("movementType") as StockMovementType;
      const variants: Record<
        string,
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "success"
        | "warning"
      > = {
        INITIAL: "secondary",
        SALE: "destructive",
        PURCHASE: "success",
        ADJUSTMENT: "warning",
        RETURN: "default",
        DAMAGE: "destructive",
      };

      return (
        <Badge variant={variants[type] || "outline"} className="capitalize">
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
          className={`font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
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
  },
  {
    accessorKey: "newStock",
    header: "New Stock",
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.getValue("reason") as string | null;
      return (
        <div className="max-w-50 truncate" title={reason ?? ""}>
          {reason || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Adjusted By",
  },
];
