import { OrderCreateSchema } from "@/schemas/order.schema";
import { Order, OrderWithDetails } from "@/schemas/type-export.schema";

export const saleApiService = {
  AddSale: async (sale: OrderWithDetails): Promise<OrderWithDetails> => {
    try {
      // Validate order header
      const validatedOrder = OrderCreateSchema.parse({
        customerId: sale.customerId,
        paymentMethodId: sale.paymentMethodId,
        totalPrice: sale.totalPrice,
        status: sale.status,
        discountPercent: sale.discountPercent,
        discountAmount: sale.discountAmount,
        taxPercent: sale.taxPercent,
        taxAmount: sale.taxAmount,
      });

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
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("Sale submission error:", {
        message: errorMessage,
        saleData: sale,
        errorStack: errorStack,
      });
      throw error;
    }
  },

  GetSales: async (): Promise<Order[]> => {
    try {
      const res = await fetch("/api/sales");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw error;
    }
  },

  GetSaleById: async (id: number): Promise<Order> => {
    try {
      const res = await fetch(`/api/sales/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error(`Error fetching sale with id ${id}:`, error);
      throw error;
    }
  },

  UpdateSale: async (
    id: number,
    sale: Partial<OrderWithDetails>
  ): Promise<OrderWithDetails> => {
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error(`Error updating sale with id ${id}:`, error);
      throw error;
    }
  },
};
