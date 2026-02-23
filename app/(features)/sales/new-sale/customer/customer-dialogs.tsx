import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Plus,
  UserCheck,
  Phone,
  Mail,
  User as UserIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from "@/schemas/type-export.schema";

import {
  BaseDialog,
  ConfirmDialog,
  FormDialog,
  ViewDialog,
} from "@/components/dialog-template";
import {
  useCustomerMutations,
  useGetCustomers,
  useGetCustomerById,
} from "@/hooks/useCustomer";
import { CustomerUpdateSchema } from "@/schemas/customer.schema";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const [searchQuery, setSearchQuery] = useState("");
  const { addCustomer } = useCustomerMutations();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CustomerCreate>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const phoneNumber = useWatch({ control, name: "phone" }) || "";
  const {
    data: searchResults,
    isLoading: isSearching,
    isFetched,
  } = useGetCustomers(searchQuery.length >= 9 ? searchQuery : undefined);

  const existingCustomer = searchResults?.[0];

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setSearchQuery("");
    }
    onOpenChange(newOpen);
  };

  const handleCheckPhone = () => {
    if (phoneNumber.length < 9) {
      toast.error("Please enter at least 9 digits to check");
      return;
    }
    setSearchQuery(phoneNumber);
  };

  const onAddCustomer = async (data: CustomerCreate) => {
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

  const handleSelectExisting = () => {
    if (existingCustomer) {
      onSuccess?.(existingCustomer);
      onOpenChange(false);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Add Customer"
      description="Enter phone number to check existence"
      className="sm:max-w-112.5"
    >
      <div className="space-y-6 py-4">
        {/* Phone Search Section */}
        <div className="space-y-2">
          <Label htmlFor="search-phone">Phone Number</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-phone"
                placeholder="091xxx..."
                className="pl-9"
                {...register("phone")}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCheckPhone}
              disabled={isSearching}
            >
              {isSearching ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Check
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {isFetched && searchQuery && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {existingCustomer ? (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 font-outfit">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary">
                      Found Existing Record
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSelectExisting}
                    className="gap-2 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Select
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{existingCustomer.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {existingCustomer.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onAddCustomer)}
                className="space-y-4 pt-2 border-t"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600 mb-2">
                  <Plus className="h-4 w-4" />
                  No customer found. Create new?
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className="pl-9"
                      {...register("name")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-9"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addCustomer.isPending}
                  >
                    {addCustomer.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Create New Customer
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </BaseDialog>
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
