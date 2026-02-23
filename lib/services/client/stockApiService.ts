import { StockMovementType } from "@prisma/client";

export const stockApiService = {
  AdjustStock: async (data: {
    variantId: number;
    movementType: StockMovementType;
    quantity: number;
    reason?: string;
    createdBy?: string;
  }) => {
    const res = await fetch("/api/stock/adjust", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to adjust stock");
    }

    return res.json();
  },

  GetStockMovements: async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    movementType?: StockMovementType,
    variantId?: number,
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search) params.append("search", search);
    if (movementType) params.append("movementType", movementType);
    if (variantId) params.append("variantId", variantId.toString());

    const res = await fetch(`/api/stock/adjust?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch stock movements");
    return res.json();
  },

  BulkAdjustStock: async (data: {
    adjustments: Array<{
      variantId: number;
      movementType: StockMovementType;
      quantity: number;
      reason?: string;
      createdBy?: string;
    }>;
  }) => {
    const res = await fetch("/api/stock/adjust/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to perform bulk adjustment");
    }

    return res.json();
  },
};
