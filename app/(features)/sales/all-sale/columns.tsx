"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Printer, CheckCircle2, Edit, Eye } from "lucide-react";
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
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={() => setViewOpen(true)}
          title="View Order"
        >
          <Eye className="h-4 w-4 text-sky-600" />
        </Button>

        {/* View Invoice */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 cursor-pointer text-indigo-600 hover:text-indigo-700 hover:bg-neutral-100"
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
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={() => router.push(`/sales/edit/${order.id}`)}
                title="Edit Order"
              >
                <Edit className="h-4 w-4 text-amber-600" />
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
                  className="h-8 w-8 p-0 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
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
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="px-4">{row.index + 1}</div>;
    },
  },
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          Invoice No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="px-4">{row.original.id}</div>;
    },
  },
  {
    accessorKey: "customer.name",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="px-4">{row.original.customer?.name}</div>;
    },
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
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      let statusClass = "";
      if (status === "COMPLETED") {
        statusClass = "bg-green-100 text-green-800";
      } else if (status === "PENDING") {
        statusClass = "bg-yellow-100 text-yellow-800";
      } else {
        statusClass = "bg-red-100 text-red-800";
      }
      return (
        <span className={`px-2 py-1 rounded text-xs ${statusClass}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "paymentMethod.name",
    id: "paymentMethod.name",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment Via
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="px-4">{row.original.paymentMethod?.name}</div>;
    },
    filterFn: (row, id, value) => {
      return row.original.paymentMethod?.name === value;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell order={row.original} />,
  },
];
