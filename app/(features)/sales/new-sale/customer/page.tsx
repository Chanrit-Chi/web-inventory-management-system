"use client";

import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetCustomers } from "@/hooks/useCustomer";
import React from "react";
import { columns } from "./columns";
import { CreateCustomerDialog } from "./customer-dialogs";
import { SharedLayout } from "@/components/shared-layout";

function CustomerList() {
  const { data, isLoading, error } = useGetCustomers();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  if (isLoading) return <Spinner className="size-8" />;
  if (error) return <p className="text-red-600">Error loading customers</p>;
  return (
    <div className="w-full px-4 md:px-6 py-6">
      <DataTable
        showAddNew={true}
        addNewLabel="New Customer"
        onAddNew={() => setCreateDialogOpen(true)}
        columns={columns}
        data={data || []}
      />

      <CreateCustomerDialog
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />
    </div>
  );
}

export default function CustomerPage() {
  return (
    <SharedLayout>
      <CustomerList />
    </SharedLayout>
  );
}
