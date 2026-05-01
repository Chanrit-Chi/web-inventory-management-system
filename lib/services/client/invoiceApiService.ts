import { Invoice, OrderWithRelations } from "@/schemas/type-export.schema";

export const invoiceApiService = {
  GetInvoices: async (
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    filters?: Record<string, string>,
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search) params.append("search", search);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const res = await fetch(`/api/invoices?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return res.json();
  },

  GetInvoiceById: async (id: string) => {
    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) throw new Error("Failed to fetch invoice");
    return res.json();
  },

  CreateInvoice: async (data: any) => {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create invoice");
    return res.json();
  },

  RecordPayment: async (
    invoiceId: string,
    data: {
      paymentDate: string;
      paymentMethod: string;
      amountPaid: number;
      referenceNo?: string;
      note?: string;
    },
  ) => {
    const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to record payment");
    return res.json();
  },
};
