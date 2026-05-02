"use client";

import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetExpenses } from "@/hooks/useExpense";
import React from "react";
import { columns } from "./columns";
import {
  CreateExpenseDialog,
  ManageExpenseCategoriesDialog,
} from "@/components/expense";
import { SharedLayout } from "@/components/shared-layout";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";

function ExpenseList() {
  const { data, isLoading, error } = useGetExpenses();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [manageCategoriesOpen, setManageCategoriesOpen] = React.useState(false);
  const { can } = usePermission();

  if (isLoading)
    return (
      <div className="items-center justify-center flex min-h-screen w-full">
        <Spinner className="size-8" />
      </div>
    );
  if (error) return <p className="text-red-600">Error loading expenses</p>;

  return (
    <div className="w-full px-4 md:px-6 py-6">
      <div className="flex justify-end mb-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setManageCategoriesOpen(true)}
          disabled={
            !can("expense:read") &&
            !can("expense:create") &&
            !can("expense:update") &&
            !can("expense:delete")
          }
        >
          Manage Categories
        </Button>
      </div>

      <DataTable
        showAddNew={true}
        addNewDisabled={!can("expense:create")}
        addNewLabel="New Expense"
        onAddNew={() => setCreateDialogOpen(true)}
        columns={columns}
        data={data || []}
      />

      <CreateExpenseDialog
        onOpenChange={setCreateDialogOpen}
        open={createDialogOpen}
      />

      <ManageExpenseCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
      />
    </div>
  );
}

export default function ExpensePage() {
  return (
    <SharedLayout>
      <ExpenseList />
    </SharedLayout>
  );
}
