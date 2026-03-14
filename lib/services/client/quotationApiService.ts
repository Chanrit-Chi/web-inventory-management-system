import { QuotationWithItems } from "@/schemas/type-export.schema";
import { Quotation } from "@prisma/client";

export const quotationApiService = {
  AddQuotation: async (quotation: QuotationWithItems): Promise<Quotation> => {
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quotation),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to create quotation" }));
      throw new Error(
        errorData.details ||
          errorData.error ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  },

  GetQuotations: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>,
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append("search", search);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);

    const res = await fetch(`/api/quotations?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  GetQuotationById: async (id: string): Promise<QuotationWithItems> => {
    const res = await fetch(`/api/quotations/${id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  UpdateQuotation: async (
    id: string,
    quotation: Partial<QuotationWithItems>,
  ): Promise<Quotation> => {
    const res = await fetch(`/api/quotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quotation),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to update quotation" }));
      throw new Error(
        errorData.details ||
          errorData.error ||
          `HTTP error! status: ${res.status}`,
      );
    }
    return res.json();
  },

  ConvertToSale: async (id: string, paymentMethodId: number) => {
    const res = await fetch(`/api/quotations/${id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId }),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: "Failed to convert quotation" }));
      throw new Error(
        errorData.details ||
          errorData.error ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  },
};
