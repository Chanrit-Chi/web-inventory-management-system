"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Eye, Printer, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InvoiceDialog } from "../all-sale/sale-dialogs";
import {
  Customer,
  Invoice,
  OrderWithRelations,
} from "@/schemas/type-export.schema";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { Banknote } from "lucide-react";

type Sale = OrderWithRelations;

export type InvoiceRow = Invoice & {
  customer?: Customer | null;
  order?: OrderWithRelations | null;
};

export const columns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Invoice #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "customer.name",
    header: "Customer",
  },
  {
    accessorKey: "issuedDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="px-0 hover:bg-transparent"
      >
        Issue Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("issuedDate"));
      return <span>{format(date, "PPP")}</span>;
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("totalAmount")?.toString() || "0");
      return <div className="font-medium">${amount.toFixed(2)}</div>;
    },
  },
  {
    accessorKey: "amountPaid",
    header: "Paid",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amountPaid")?.toString() || "0");
      return <div className="font-medium text-emerald-600">${amount.toFixed(2)}</div>;
    },
  },
  {
    id: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const total = Number.parseFloat(row.getValue("totalAmount")?.toString() || "0");
      const paid = Number.parseFloat(row.getValue("amountPaid")?.toString() || "0");
      const balance = total - paid;
      return (
        <div className={`font-medium ${balance > 0 ? "text-amber-600" : ""}`}>
          ${balance.toFixed(2)}
        </div>
      );
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
  const [paymentOpen, setPaymentOpen] = useState(false);
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
          className="h-8 w-8 p-0 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          onClick={handleOpenView}
          title="View Invoice"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          onClick={handleOpenPrint}
          title="Print Invoice"
        >
          <Printer className="h-4 w-4" />
        </Button>
        {invoice.status !== "PAID" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            onClick={() => setPaymentOpen(true)}
            title="Record Payment"
          >
            <Banknote className="h-4 w-4" />
          </Button>
        )}
      </div>

      {invoiceOpen && (
        <InvoiceDialog
          sale={sale}
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          autoPrint={shouldPrint}
        />
      )}

      {paymentOpen && (
        <RecordPaymentDialog
          invoice={invoice}
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
        />
      )}
    </>
  );
}
