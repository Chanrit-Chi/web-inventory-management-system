import { OrderCreateSchema, OrderUpdateSchema } from "@/schemas/order.schema";
import { Order, OrderWithDetails } from "@/schemas/type-export.schema";

export const saleApiService = {
  AddSale: async (sale: OrderWithDetails): Promise<Order> => {
    // Validate order header
    const validatedOrder = OrderCreateSchema.parse({ sale });

    // Include orderDetails in the payload
    const payload = {
      ...validatedOrder,
      orderDetails: sale.orderDetails,
    };

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to create sale" }));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetSales: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append("search", search);
    }

    if (filters) {
      if (filters.status) params.append("status", filters.status);
      if (filters["paymentMethod.name"]) {
        params.append("paymentMethod", filters["paymentMethod.name"]);
      }
    }

    const res = await fetch(`/api/sales?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  GetSaleById: async (id: number): Promise<Order> => {
    const res = await fetch(`/api/sales/${id}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return res.json();
  },

  UpdateSale: async (
    id: number,
    sale: OrderWithDetails
  ): Promise<OrderWithDetails> => {
    const validateSale = OrderUpdateSchema.parse(sale);
    const res = await fetch(`/api/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validateSale),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return res.json();
  },
};
