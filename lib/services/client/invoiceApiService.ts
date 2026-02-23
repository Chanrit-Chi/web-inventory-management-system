export const invoiceApiService = {
  GetInvoices: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>,
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: limit.toString(),
    });

    if (search) params.append("search", search);
    if (filters?.status) params.append("status", filters.status);

    const res = await fetch(`/api/invoices?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return res.json();
  },

  GetInvoiceById: async (id: string) => {
    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) throw new Error("Failed to fetch invoice");
    return res.json();
  },
};
