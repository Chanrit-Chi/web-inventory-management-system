"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Eye, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InvoiceDialog } from "../all-sale/sale-dialogs";
import {
  Customer,
  Invoice,
  OrderWithRelations,
} from "@/schemas/type-export.schema";

type Sale = OrderWithRelations;

type InvoiceRow = Invoice & {
  customer?: Customer | null;
  order?: OrderWithRelations | null;
};

export const columns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice #",
  },
  {
    accessorKey: "customer.name",
    header: "Customer",
  },
  {
    accessorKey: "issuedDate",
    header: "Issue Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("issuedDate"));
      return <span>{format(date, "PPP")}</span>;
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("totalAmount"));
      return <div className="font-medium">${amount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status"));
      return <StatusBadge status={status} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <ActionCell row={row} />;
    },
  },
];

function ActionCell({ row }: { readonly row: { original: InvoiceRow } }) {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [shouldPrint, setShouldPrint] = useState(false);
  const invoice = row.original;

  const sale: Sale = {
    ...invoice.order,
    invoice: invoice,
    customer: invoice.customer,
  } as Sale;

  const handleOpenView = () => {
    setShouldPrint(false);
    setInvoiceOpen(true);
  };

  const handleOpenPrint = () => {
    setShouldPrint(true);
    setInvoiceOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={handleOpenView}
          title="View Invoice"
        >
          <Eye className="h-4 w-4 text-sky-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={handleOpenPrint}
          title="Print Invoice"
        >
          <Printer className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </Button>
      </div>

      {invoiceOpen && (
        <InvoiceDialog
          sale={sale}
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          autoPrint={shouldPrint}
        />
      )}
    </>
  );
}
