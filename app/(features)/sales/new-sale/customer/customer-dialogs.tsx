import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from "@/schemas/type-export.schema";
import { toast } from "sonner";

import {
  ConfirmDialog,
  FormDialog,
  ViewDialog,
} from "@/components/dialog-template";
import { useCustomerMutations, useGetCustomerById } from "@/hooks/useCustomer";
import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
} from "@/schemas/customer.schema";

// Create Customer Dialog
export function CreateCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: (customer: Customer) => void;
}) {
  const { addCustomer } = useCustomerMutations();

  const handleSubmit = async (data: CustomerCreate) => {
    try {
      const newCustomer = await addCustomer.mutateAsync(data);
      toast.success("Customer created successfully");
      onSuccess?.(newCustomer);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create customer");
      console.error(error);
    }
  };

  return (
    <FormDialog<typeof CustomerCreateSchema>
      open={open}
      onOpenChange={onOpenChange}
      title="Create Customer"
      description="Add a new customer to your inventory"
      schema={CustomerCreateSchema}
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Enter customer name",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter customer email",
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Enter customer phone",
        },
      ]}
      defaultValues={{
        name: "",
        email: "",
        phone: "",
      }}
      onSubmit={handleSubmit}
      submitLabel="Create"
      isSubmitting={addCustomer.isPending}
    />
  );
}

// View Customer Dialog
export function ViewCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  readonly customer: Customer;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <ViewDialog<Customer>
      open={open}
      onOpenChange={onOpenChange}
      title="View Customer"
      description="Customer details and information"
      item={customer}
      fields={[
        {
          label: "Name",
          value: (cust) => cust.name,
        },
        {
          label: "Email",
          value: (cust) => cust.email || "No email",
        },
        {
          label: "Phone",
          value: (cust) => cust.phone || "No phone",
        },
        {
          label: "Created At",
          value: (cust) => new Date(cust.createdAt).toLocaleString(),
        },
        {
          label: "Updated At",
          value: (cust) => new Date(cust.updatedAt).toLocaleString(),
        },
      ]}
    />
  );
}

// Update Customer Dialog
export function UpdateCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  readonly customer: Customer;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { updateCustomer } = useCustomerMutations();
  const { data: customerData } = useGetCustomerById(customer.id);

  const handleSubmit = async (data: CustomerUpdate) => {
    try {
      await updateCustomer.mutateAsync({ id: customer.id, data });
      toast.success("Customer updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update customer");
      console.error(error);
    }
  };

  return (
    <FormDialog<typeof CustomerUpdateSchema>
      open={open}
      onOpenChange={onOpenChange}
      title="Update Customer"
      description="Make changes to the customer information"
      schema={CustomerUpdateSchema}
      fields={[
        {
          name: "name",
          label: "Name",
          placeholder: "Enter customer name",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter customer email",
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Enter customer phone",
        },
      ]}
      defaultValues={{
        name: customerData?.name || customer.name,
        email: customerData?.email || customer.email || "",
        phone: customerData?.phone || customer.phone || "",
      }}
      onSubmit={handleSubmit}
      submitLabel="Updating"
      isSubmitting={updateCustomer.isPending}
    />
  );
}

// Delete Customer Dialog
export function DeleteCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  readonly customer: Customer;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { deleteCustomer } = useCustomerMutations();

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(customer.id);
      toast.success("Customer deleted successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete customer");
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<Customer>
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Customer"
      description="Are you sure you want to delete this customer? This action cannot be undone."
      item={customer}
      renderItem={(cust) => (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold">Customer Name:</p>
          <p className="text-sm">{cust.name}</p>
          {cust.email && (
            <>
              <p className="text-sm font-semibold mt-2">Email:</p>
              <p className="text-sm">{cust.email}</p>
            </>
          )}
          {cust.phone && (
            <>
              <p className="text-sm font-semibold mt-2">Phone:</p>
              <p className="text-sm">{cust.phone}</p>
            </>
          )}
        </div>
      )}
      onConfirm={handleDelete}
      confirmLabel="Deleting"
      isLoading={deleteCustomer.isPending}
    />
  );
}
