"use client";

import { toast } from "sonner";
import {
  ConfirmDialog,
  FormDialog,
  ViewDialog,
} from "@/components/dialog-template";
import {
  SupplierCreateSchema,
  SupplierUpdateSchema,
} from "@/schemas/supplier.schema";
import { useSupplierMutations } from "@/hooks/useSupplier";
import type { SupplierRow } from "./columns";

// ============================================
// Create Supplier Dialog
// ============================================
interface CreateSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSupplierDialog({
  open,
  onOpenChange,
}: CreateSupplierDialogProps) {
  const { addSupplier } = useSupplierMutations();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add New Supplier"
      description="Fill in the supplier details below."
      schema={SupplierCreateSchema}
      fields={[
        {
          name: "name",
          label: "Supplier Name",
          placeholder: "Enter supplier name",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "supplier@example.com",
          type: "email",
          required: true,
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Enter phone number",
          required: true,
        },
        {
          name: "address",
          label: "Address",
          placeholder: "Enter full address",
          type: "textarea",
          rows: 3,
          required: true,
        },
      ]}
      submitLabel="Add Supplier"
      isSubmitting={addSupplier.isPending}
      onSubmit={async (data) => {
        addSupplier.mutate(data, {
          onSuccess: () => {
            toast.success("Supplier added successfully");
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error(err.message);
          },
        });
      }}
    />
  );
}

// ============================================
// View Supplier Dialog
// ============================================
interface ViewSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierRow;
}

export function ViewSupplierDialog({
  open,
  onOpenChange,
  supplier,
}: ViewSupplierDialogProps) {
  return (
    <ViewDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supplier Details"
      description="Detailed information about this supplier."
      item={supplier}
      fields={[
        { label: "Name", value: (s) => s.name },
        { label: "Email", value: (s) => s.email },
        { label: "Phone", value: (s) => s.phone },
        { label: "Address", value: (s) => s.address },
        {
          label: "Total Purchase Orders",
          value: (s) => String(s._count.purchaseOrders),
        },
        {
          label: "Linked Products",
          value: (s) => String(s._count.products),
        },
        {
          label: "Created",
          value: (s) => new Date(s.createdAt).toLocaleDateString(),
        },
      ]}
    />
  );
}

// ============================================
// Update Supplier Dialog
// ============================================
interface UpdateSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierRow;
}

export function UpdateSupplierDialog({
  open,
  onOpenChange,
  supplier,
}: UpdateSupplierDialogProps) {
  const { updateSupplier } = useSupplierMutations();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Supplier"
      description="Update the supplier information."
      schema={SupplierUpdateSchema}
      defaultValues={{
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
      }}
      fields={[
        {
          name: "name",
          label: "Supplier Name",
          placeholder: "Enter supplier name",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "supplier@example.com",
          type: "email",
          required: true,
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Enter phone number",
          required: true,
        },
        {
          name: "address",
          label: "Address",
          placeholder: "Enter full address",
          type: "textarea",
          rows: 3,
          required: true,
        },
      ]}
      submitLabel="Update Supplier"
      isSubmitting={updateSupplier.isPending}
      onSubmit={async (data) => {
        updateSupplier.mutate(
          { id: supplier.id, data },
          {
            onSuccess: () => {
              toast.success("Supplier updated successfully");
              onOpenChange(false);
            },
            onError: (err) => {
              toast.error(err.message);
            },
          },
        );
      }}
    />
  );
}

// ============================================
// Delete Supplier Dialog
// ============================================
interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierRow;
}

export function DeleteSupplierDialog({
  open,
  onOpenChange,
  supplier,
}: DeleteSupplierDialogProps) {
  const { deleteSupplier } = useSupplierMutations();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Supplier"
      description={`Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`}
      item={supplier}
      renderItem={(s) => (
        <div className="rounded-lg bg-muted p-4 space-y-1">
          <p className="font-medium">{s.name}</p>
          <p className="text-sm text-muted-foreground">{s.email}</p>
          {s._count.purchaseOrders > 0 && (
            <p className="text-sm text-red-500">
              Warning: This supplier has {s._count.purchaseOrders} purchase
              order(s).
            </p>
          )}
        </div>
      )}
      confirmLabel="Delete"
      confirmVariant="destructive"
      isLoading={deleteSupplier.isPending}
      onConfirm={async () => {
        deleteSupplier.mutate(supplier.id, {
          onSuccess: () => {
            toast.success("Supplier deleted successfully");
            onOpenChange(false);
          },
          onError: (err) => {
            toast.error(err.message);
          },
        });
      }}
    />
  );
}
