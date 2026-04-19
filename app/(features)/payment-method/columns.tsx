"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PaymentMethod } from "@/lib/services/client/paymentMethodApiService";
import { Button } from "@/components/ui/button";
import { SquarePen, Trash2 } from "lucide-react";
import { useState } from "react";
import { UpdatePaymentMethodDialog, DeletePaymentMethodDialog } from "./payment-method-dialogs";
import { usePermission } from "@/hooks/usePermission";

// 1. Create a separate component for the actions to use hooks correctly
const ActionCell = ({ paymentMethod }: { paymentMethod: PaymentMethod }) => {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { can } = usePermission();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        disabled={!can("payment_method:update")}
        onClick={() => setUpdateOpen(true)}
      >
        <SquarePen className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        disabled={!can("payment_method:delete")}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <UpdatePaymentMethodDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        paymentMethod={paymentMethod}
      />
      <DeletePaymentMethodDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        paymentMethod={paymentMethod}
      />
    </div>
  );
};

export const columns: ColumnDef<PaymentMethod>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.original.createdAt).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell paymentMethod={row.original} />, // 2. Render the component here
  },
];
