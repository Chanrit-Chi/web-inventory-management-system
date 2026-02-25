import { PurchaseOrderWithDetails } from "@/schemas/type-export.schema";

export const purchaseOrderApiService = {
  GetPurchaseOrders: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>,
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.supplierId ? { supplierId: filters.supplierId } : {}),
    });
    const res = await fetch(`/api/purchase-orders?${params}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to fetch purchase orders" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetPurchaseOrderById: async (id: number) => {
    const res = await fetch(`/api/purchase-orders/${id}`);

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Purchase order not found" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  AddPurchaseOrder: async (data: PurchaseOrderWithDetails) => {
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to create purchase order" }));
      throw new Error(
        errorData.error ||
          errorData.details ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  },

  UpdatePurchaseOrder: async (
    id: number,
    data: Partial<PurchaseOrderWithDetails>,
  ) => {
    const res = await fetch("/api/purchase-orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to update purchase order" }));
      throw new Error(
        errorData.error ||
          errorData.details ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  },

  DeletePurchaseOrder: async (id: number): Promise<void> => {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to delete purchase order" }));
      throw new Error(
        errorData.error ||
          errorData.details ||
          `HTTP error! status: ${res.status}`,
      );
    }
  },
};
