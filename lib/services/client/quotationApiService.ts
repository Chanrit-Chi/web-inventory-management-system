export const quotationApiService = {
  fetchQuotations: async (
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
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const res = await fetch(`/api/quotations?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch quotations");
    return res.json();
  },

  fetchQuotationById: async (id: string) => {
    const res = await fetch(`/api/quotations/${id}`);
    if (!res.ok) throw new Error("Failed to fetch quotation");
    return res.json();
  },

  createQuotation: async (data: any) => {
    const res = await fetch("/api/quotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create quotation");
    return res.json();
  },

  updateQuotation: async (id: string, data: any) => {
    const res = await fetch(`/api/quotations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update quotation");
    return res.json();
  },

  deleteQuotation: async (id: string) => {
    const res = await fetch(`/api/quotations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete quotation");
    return res.json();
  },

  convertToOrder: async (id: string, paymentMethodId: number) => {
    const res = await fetch(`/api/quotations/${id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId }),
    });
    if (!res.ok) throw new Error("Failed to convert quotation to order");
    return res.json();
  },
};
