"use client";

import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetUsers } from "@/hooks/useUser";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { CreateUserDialog } from "./user-dialogs";
import { useState, useMemo } from "react";
import { usePermission } from "@/hooks/usePermission";
import { useSession } from "@/lib/auth-client";
import { Role } from "@prisma/client";

function EmployeeList() {
  const { data, isLoading, error } = useGetUsers();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { can } = usePermission();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const currentUserId = session?.user?.id;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;

  // Filter user list by role hierarchy and self-visibility
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((user) => {
      // Non-super-admin cannot see super-admin users
      if (!isSuperAdmin && user.role === Role.SUPER_ADMIN) {
        return false;
      }

      // Non-super-admin should not manage themselves in this table
      if (!isSuperAdmin && currentUserId && user.id === currentUserId) {
        return false;
      }

      return true;
    });
  }, [data, isSuperAdmin, currentUserId]);

  if (isLoading)
    return (
      <div className="items-center justify-center flex min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );
  if (error) return <p className="text-red-600">Failed to load users</p>;

  return (
    <div className="w-full px-4 md:px-6 py-6">
      <DataTable
        showAddNew={true}
        addNewDisabled={!can("user:create")}
        addNewLabel="New User"
        onAddNew={() => setCreateDialogOpen(true)}
        columns={columns}
        data={filteredData}
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
