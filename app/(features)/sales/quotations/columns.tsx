"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Eye, Edit, Trash, ArrowRightLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  ConvertQuotationDialog,
  ViewQuotationDialog,
} from "./quotation-dialogs";
import { useGetQuotationById } from "@/hooks/useQuotation";
import Link from "next/link";
import { usePermission } from "@/hooks/usePermission";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type QuotationListing = {
  id: string;
  quotationNumber: string;
  customer: {
    name: string;
  };
  totalAmount: number;
  status: string;
  issueDate: string;
  validUntil: string;
};

export const columns: ColumnDef<QuotationListing>[] = [
  {
    accessorKey: "quotationNumber",
    header: "Quotation #",
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.getValue("quotationNumber")}
      </span>
    ),
  },
  {
    accessorKey: "customer.name",
    header: "Customer",
  },
  {
    accessorKey: "issueDate",
    header: "Date",
    cell: ({ row }) =>
      format(new Date(row.getValue("issueDate")), "dd MMM yyyy"),
  },
  {
    accessorKey: "validUntil",
    header: "Valid Until",
    cell: ({ row }) =>
      format(new Date(row.getValue("validUntil")), "dd MMM yyyy"),
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
      const variants: Record<
        string,
        "secondary" | "info" | "success" | "destructive" | "warning" | "default"
      > = {
        DRAFT: "secondary",
        SENT: "info",
        ACCEPTED: "success",
        REJECTED: "destructive",
        EXPIRED: "warning",
        CONVERTED: "default",
      };
      const status = row.getValue("status");
      return (
        <Badge variant={variants[status as string] || "default"}>
          {status as string}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <ActionCell row={row} />;
    },
  },
];

function ActionCell({ row }: { readonly row: Row<QuotationListing> }) {
  const [convertOpen, setConvertOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [shouldPrint, setShouldPrint] = useState(false);
  const quotation = row.original;
  const { can } = usePermission();

  // Fetch full quotation data for the dialog
  const { data: fullQuotation } = useGetQuotationById(quotation.id);

  return (
    <>
      <div className="flex items-center gap-1">
        {/* View Details */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => setViewOpen(true)}
          title="View Details"
        >
          <Eye className="h-4 w-4 text-sky-600" />
        </Button>

        {/* Edit Quotation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer"
                asChild={
                  quotation.status !== "CONVERTED" && can("quotation:update")
                }
                disabled={
                  quotation.status === "CONVERTED" || !can("quotation:update")
                }
                title="Edit Quotation"
              >
                {quotation.status !== "CONVERTED" && can("quotation:update") ? (
                  <Link href={`/sales/quotations/edit/${quotation.id}`}>
                    <Edit className="h-4 w-4 text-amber-600" />
                  </Link>
                ) : (
                  <Edit
                    className={`h-4 w-4 ${quotation.status === "CONVERTED" ? "text-slate-400" : "text-amber-600"}`}
                  />
                )}
              </Button>
            </span>
          </TooltipTrigger>
          {!can("quotation:update") && quotation.status !== "CONVERTED" && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>

        {/* Print */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => {
            setShouldPrint(true);
            setViewOpen(true);
          }}
          title="Print Quotation"
        >
          <Printer className="h-4 w-4 text-indigo-600" />
        </Button>

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                disabled={!can("quotation:delete")}
                className="h-8 w-8 p-0 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete Quotation"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          {!can("quotation:delete") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>

        {/* Convert to Sale */}
        {quotation.status !== "CONVERTED" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!can("quotation:update")}
                  className="h-8 w-8 p-0 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={
                    can("quotation:update")
                      ? () => setConvertOpen(true)
                      : undefined
                  }
                  title="Convert to Sale"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            {!can("quotation:update") && (
              <TooltipContent>No permission</TooltipContent>
            )}
          </Tooltip>
        )}
      </div>

      <ViewQuotationDialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setShouldPrint(false);
        }}
        quotation={fullQuotation ?? null}
        autoPrint={shouldPrint}
      />

      <ConvertQuotationDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        quotationId={quotation.id}
        quotationNumber={quotation.quotationNumber}
      />
    </>
  );
}
