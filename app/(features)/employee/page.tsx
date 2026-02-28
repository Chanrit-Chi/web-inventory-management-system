"use client";

import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetUsers } from "@/hooks/useUser";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { CreateUserDialog } from "./user-dialogs";
import { useState } from "react";
import { usePermission } from "@/hooks/usePermission";

function EmployeeList() {
  const { data, isLoading, error } = useGetUsers();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { can } = usePermission();

  if (isLoading) return <Spinner className="size-8" />;
  if (error) return <p className="text-red-600">Failed to load users</p>;

  return (
    <div className="w-full px-4 md:px-6 py-6">
      <DataTable
        showAddNew={true}
        addNewDisabled={!can("user:create")}
        addNewLabel="New User"
        onAddNew={() => setCreateDialogOpen(true)}
        columns={columns}
        data={data || []}
        rowFilters={[
          {
            columnId: "isActive",
            label: "Status",
            options: [
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
        ]}
      />
      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}

export default function EmployeePage() {
  return (
    <SharedLayout>
      <EmployeeList />
    </SharedLayout>
  );
}
