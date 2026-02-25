import {
  SupplierCreateSchema,
  SupplierUpdateSchema,
} from "@/schemas/supplier.schema";
import {
  Supplier,
  SupplierCreate,
  SupplierUpdate,
} from "@/schemas/type-export.schema";

export const supplierApiService = {
  GetSuppliers: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
    });
    const res = await fetch(`/api/suppliers?${params}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch suppliers" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetAllSuppliers: async (): Promise<
    { id: string; name: string; email: string }[]
  > => {
    const res = await fetch("/api/suppliers?all=true");

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch suppliers" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetSupplierById: async (id: string): Promise<Supplier> => {
    const res = await fetch(`/api/suppliers/${id}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Supplier not found" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  AddSupplier: async (supplier: SupplierCreate): Promise<Supplier> => {
    const validated = SupplierCreateSchema.parse(supplier);
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validated),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to add supplier" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  UpdateSupplier: async (
    id: string,
    supplier: SupplierUpdate,
  ): Promise<Supplier> => {
    const validated = SupplierUpdateSchema.parse(supplier);
    const res = await fetch("/api/suppliers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...validated }),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to update supplier" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  DeleteSupplier: async (id: string): Promise<void> => {
    const res = await fetch(`/api/suppliers/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to delete supplier" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
  },
};
