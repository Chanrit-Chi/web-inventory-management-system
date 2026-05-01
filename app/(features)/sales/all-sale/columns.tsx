"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Printer, CheckCircle2, SquarePen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderWithRelations } from "@/schemas/type-export.schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CompleteSaleDialog,
  InvoiceDialog,
  ViewSaleDialog,
} from "./sale-dialogs";
import { useSaleMutations } from "@/hooks/useSale";
import { toast } from "sonner";
import { usePermission } from "@/hooks/usePermission";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/StatusBadge";

// Actions Cell Component (needs hooks, so separate from column definition)
function ActionsCell({ order }: { readonly order: OrderWithRelations }) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [shouldPrint, setShouldPrint] = useState(false);
  const { updateSale } = useSaleMutations();
  const { can } = usePermission();

  const handleMarkAsCompleted = (callbacks?: {
    onSuccess?: () => void;
    onError?: (err: Error) => void;
  }) => {
    updateSale.mutate(
      { id: order.id, status: "COMPLETED" },
      {
        onSuccess: () => {
          toast.success("Sale marked as completed");
          callbacks?.onSuccess?.();
        },
        onError: (err: Error) => {
          toast.error(err.message);
          callbacks?.onError?.(err);
        },
      },
    );
  };

  const handleOpenView = () => {
    setShouldPrint(false);
    setInvoiceOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* View Order */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          onClick={() => setViewOpen(true)}
          title="View Order"
        >
          <Eye className="h-4 w-4" />
        </Button>

        {/* View Invoice */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          onClick={handleOpenView}
          title="View Invoice"
        >
          <Printer className="h-4 w-4" />
        </Button>

        {/* Edit Order */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                disabled={order.status === "COMPLETED" || !can("sale:update")}
                className="h-8 w-8 p-0 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                onClick={() => router.push(`/sales/edit/${order.id}`)}
                title="Edit Order"
              >
                <SquarePen className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          {!can("sale:update") && (
            <TooltipContent>No permission</TooltipContent>
          )}
        </Tooltip>

        {/* Complete Sale */}
        {order.status !== "COMPLETED" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 cursor-pointer text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  onClick={() => setCompleteOpen(true)}
                  disabled={updateSale.isPending || !can("sale:update")}
                  title="Mark as Completed"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            {!can("sale:update") && (
              <TooltipContent>No permission</TooltipContent>
            )}
          </Tooltip>
        )}
      </div>

      {/*Open Sale Dialog */}
      <ViewSaleDialog open={viewOpen} onOpenChange={setViewOpen} sale={order} />
      {/*Open Invoice Dialog */}
      <InvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        sale={order}
        autoPrint={shouldPrint}
      />
      {/*Complete Sale Dialog */}
      <CompleteSaleDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        sale={order}
        isLoading={updateSale.isPending}
        onConfirm={() => {
          handleMarkAsCompleted({
            onSuccess: () => setCompleteOpen(false),
          });
        }}
      />
    </>
  );
}

export const columns: ColumnDef<OrderWithRelations>[] = [
  {
    accessorKey: "index",
    header: "#",
    cell: ({ row }) => {
      return <div className="text-center">{row.index + 1}</div>;
    },
    size: 40,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        className="-ml-3"
      >
        Inv #
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.original.id}</div>,
    size: 80,
  },
  {
    accessorKey: "customer.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Customer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="truncate max-w-[120px]">{row.original.customer?.name}</div>,
  },
  {
    accessorKey: "totalPrice",
    header: "Total",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("totalPrice"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return formatted;
    },
  },
  {
    id: "paidAmount",
    header: "Paid",
    cell: ({ row }) => {
      const invoice = row.original.invoice;
      const amount = invoice ? Number(invoice.amountPaid) : 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    },
  },
  {
    id: "balanceAmount",
    header: "Balance",
    cell: ({ row }) => {
      const total = Number(row.original.totalPrice);
      const invoice = row.original.invoice;
      const paid = invoice ? Number(invoice.amountPaid) : 0;
      const balance = total - paid;
      return (
        <span className={balance > 0 ? "text-amber-600 font-medium" : ""}>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(balance)}
        </span>
      );
    },
  },
  {
    accessorKey: "discountAmount",
    header: "Discount",
    cell: ({ row }) => {
      const discountAmount = Number.parseFloat(row.getValue("discountAmount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(discountAmount);

      return formatted;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: "paymentMethod.name",
    id: "paymentMethod.name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Via
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-xs">{row.original.paymentMethod?.name}</div>,
    size: 80,
    filterFn: (row, id, value) => {
      return row.original.paymentMethod?.name === value;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div className="text-xs whitespace-nowrap">{date.toLocaleDateString()}</div>;
    },
    size: 90,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell order={row.original} />,
  },
];
