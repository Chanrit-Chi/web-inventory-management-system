"use client";

import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetUnits } from "@/hooks/useUnit";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { useState } from "react";
import { CreateUnitDialog } from "./unit-dialogs";
import { usePermission } from "@/hooks/usePermission";

function UnitList() {
  const { data, isLoading, error } = useGetUnits();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { can } = usePermission();

  if (isLoading)
    return <Spinner className="size-8 items-center justify-center" />;
  if (error) return <p className="text-red-600">Failed to load units</p>;
  return (
    <div className="w-full px-4 md:px-6 py-6">
      <DataTable
        showAddNew={true}
        addNewDisabled={!can("unit:create")}
        addNewLabel="New Unit"
        onAddNew={() => setCreateDialogOpen(true)}
        columns={columns}
        data={data || []}
      />
      <CreateUnitDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}

export default function UnitPage() {
  return (
    <SharedLayout>
      <UnitList />
    </SharedLayout>
  );
}
