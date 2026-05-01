import { OrderWithDetailsSchema, OrderWithDetailsUpdateSchema } from "@/schemas/complex.schema";
import { Order, OrderWithDetails } from "@/schemas/type-export.schema";

export const saleApiService = {
  AddSale: async (sale: OrderWithDetails): Promise<Order> => {
    // Validate order header and details
    const validatedOrder = OrderWithDetailsSchema.parse(sale);

    // Convert Decimal values to numbers for JSON serialization
    const payload = {
      ...validatedOrder,
      totalPrice: validatedOrder.totalPrice.toNumber(),
      discountAmount: validatedOrder.discountAmount.toNumber(),
      taxAmount: validatedOrder.taxAmount.toNumber(),
      orderDetails: validatedOrder.orderDetails.map((detail) => {
        const data: Record<string, unknown> = {
          ...detail,
        };
        if (detail.unitPrice != null && typeof detail.unitPrice !== 'number') {
           if ('toNumber' in detail.unitPrice && typeof detail.unitPrice.toNumber === 'function') {
             data.unitPrice = detail.unitPrice.toNumber();
           }
        }
        return data;
      }),
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
      throw new Error(
        errorData.details ||
          errorData.error ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  },

  GetSales: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>,
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
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
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
    sale: OrderWithDetails,
  ): Promise<OrderWithDetails> => {
    console.log("UpdateSale called with:", { id, sale });

    // Transform orderDetails to ensure only required fields are included
    const transformedSale = {
      ...sale,
      orderDetails: sale.orderDetails?.map((detail) => {
        const data: Record<string, unknown> = {
          productId: detail.productId,
          variantId: detail.variantId,
          quantity: detail.quantity,
        };
        if (detail.unitPrice != null) {
          data.unitPrice = detail.unitPrice;
        }
        return data;
      }),
    };

    console.log("Transformed sale:", transformedSale);

    // Validate using the proper update schema that includes orderDetails
    const validateSale = OrderWithDetailsUpdateSchema.parse({
      ...transformedSale,
      id,
    });

    console.log("Validated sale:", validateSale);

    // Convert Decimal values to numbers for JSON serialization
    const payload: Record<string, unknown> = {};

    // Copy all fields from validated sale
    Object.entries(validateSale).forEach(([key, value]) => {
      if (value !== undefined) {
        payload[key] = value;
      }
    });

    // Handle Decimal conversions
    if (
      payload.totalPrice &&
      typeof payload.totalPrice === "object" &&
      "toNumber" in payload.totalPrice
    ) {
      payload.totalPrice = (
        payload.totalPrice as { toNumber: () => number }
      ).toNumber();
    }
    if (
      payload.discountAmount &&
      typeof payload.discountAmount === "object" &&
      "toNumber" in payload.discountAmount
    ) {
      payload.discountAmount = (
        payload.discountAmount as { toNumber: () => number }
      ).toNumber();
    }
    if (
      payload.taxAmount &&
      typeof payload.taxAmount === "object" &&
      "toNumber" in payload.taxAmount
    ) {
      payload.taxAmount = (
        payload.taxAmount as { toNumber: () => number }
      ).toNumber();
    }
    if (payload.orderDetails && Array.isArray(payload.orderDetails)) {
      payload.orderDetails = payload.orderDetails.map(
        (detail: {
          unitPrice?: { toNumber?: () => number } | number;
          [key: string]: unknown;
        }) => {
          let convertedUnitPrice = detail.unitPrice;
          if (
            detail.unitPrice &&
            typeof detail.unitPrice === "object" &&
            "toNumber" in detail.unitPrice
          ) {
            const toNumberFn = detail.unitPrice.toNumber;
            if (toNumberFn) {
              convertedUnitPrice = toNumberFn();
            }
          }
          return {
            ...detail,
            unitPrice: convertedUnitPrice,
          };
        },
      );
    }

    // Remove id from payload since it's in the URL
    delete payload.id;

    console.log("Sending update payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(`/api/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Server error response:", errorBody);
      throw new Error(
        errorBody.details ||
          errorBody.error ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  },
};
