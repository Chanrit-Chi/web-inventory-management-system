"use client";

import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetPaymentMethods } from "@/hooks/usePaymentMethod";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { CreatePaymentMethodDialog } from "./payment-method-dialogs";
import { useState } from "react";
import { usePermission } from "@/hooks/usePermission";

function PaymentMethodList() {
  const { data, isLoading, error } = useGetPaymentMethods();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { can } = usePermission();

  if (isLoading) return <Spinner className="size-8" />;
  if (error) return <p className="text-red-600">Failed to load payment methods</p>;

  return (
    <div className="w-full px-4 md:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Payment Methods</h1>
      </div>
      <DataTable
        showAddNew={true}
        addNewDisabled={!can("payment_method:create")}
        addNewLabel="New Payment Method"
        onAddNew={() => setCreateDialogOpen(true)}
        columns={columns}
        data={data || []}
      />
      <CreatePaymentMethodDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}

export default function PaymentMethodPage() {
  return (
    <SharedLayout>
      <PaymentMethodList />
    </SharedLayout>
  );
}
