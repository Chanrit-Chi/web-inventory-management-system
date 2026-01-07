import { CustomerSchema } from "@/schemas/customer.schema";
import { Customer, CustomerCreate } from "@/schemas/type-export.schema";

export const customerApiService = {
  AddCustomer: async (customer: CustomerCreate): Promise<Customer> => {
    try {
      const validateCustomer = CustomerSchema.parse({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      });
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validateCustomer),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Error adding customer:", error);
      throw error;
    }
  },

  GetCustomers: async (): Promise<Customer[]> => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  GetCustomerById: async (id: string): Promise<Customer> => {
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error("Error fetching customer by ID:", error);
      throw error;
    }
  },

  UpdateCustomer: async (
    id: string,
    customer: Partial<Customer>
  ): Promise<Customer> => {
    try {
      const validateCustomer = CustomerSchema.partial().parse(customer);
      const res = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...validateCustomer }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  DeleteCustomer: async (id: string): Promise<void> => {
    try {
      const res = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },
};
