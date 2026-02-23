import {
  CustomerCreateSchema,
  CustomerUpdateSchema,
} from "@/schemas/customer.schema";
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from "@/schemas/type-export.schema";

export const customerApiService = {
  AddCustomer: async (customer: CustomerCreate): Promise<Customer> => {
    const validateCustomer = CustomerCreateSchema.parse(customer);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validateCustomer),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to add customer" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetCustomers: async (phone?: string): Promise<Customer[]> => {
    const url = phone
      ? `/api/customers?phone=${encodeURIComponent(phone)}`
      : "/api/customers";
    const res = await fetch(url);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch customers" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetCustomerById: async (id: string): Promise<Customer> => {
    const res = await fetch(`/api/customers/${id}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Customer not found" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  UpdateCustomer: async (
    id: string,
    customer: CustomerUpdate,
  ): Promise<Customer> => {
    const validateCustomer = CustomerUpdateSchema.parse(customer);
    const res = await fetch("/api/customers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...validateCustomer }),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to update customer" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  DeleteCustomer: async (id: string): Promise<void> => {
    const res = await fetch("/api/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to delete customer" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
  },
};
