import { invoiceApiService } from "@/lib/services/client/invoiceApiService";
import { useQuery } from "@tanstack/react-query";

export const useGetInvoices = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: Record<string, string>,
) =>
  useQuery({
    queryKey: ["invoices", page, limit, search, filters],
    queryFn: () => invoiceApiService.GetInvoices(page, limit, search, filters),
  });

export const useGetInvoiceById = (id: string) =>
  useQuery({
    queryKey: ["invoices", id],
    queryFn: () => invoiceApiService.GetInvoiceById(id),
    enabled: !!id,
  });
