"use client";

import { DataTable } from "@/components/ui/data-table";
import { Spinner } from "@/components/ui/spinner";
import { useGetCategories } from "@/hooks/useCategory";
import { columns } from "./columns";
import { SharedLayout } from "@/components/shared-layout";
import { CreateCategoryDialog } from "./category-dialogs";
import { useState } from "react";

function CategoryList() {
  const { data, isLoading, error } = useGetCategories();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading) return <Spinner className="size-8" />;
  if (error) return <p className="text-red-600">Failed to load categories</p>;

  return (
    <div className="w-full px-4 md:px-6 py-6">
      <DataTable
        showAddNew={true}
        addNewLabel="New Category"
        onAddNew={() => setCreateDialogOpen(true)}
        columns={columns}
        data={data || []}
      />
      <CreateCategoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <SharedLayout>
      <CategoryList />
    </SharedLayout>
  );
}
