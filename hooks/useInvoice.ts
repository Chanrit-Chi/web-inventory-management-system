import { invoiceApiService } from "@/lib/services/client/invoiceApiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    queryKey: ["invoice", id],
    queryFn: () => invoiceApiService.GetInvoiceById(id),
    enabled: !!id,
  });

export const useInvoiceMutation = () => {
  const queryClient = useQueryClient();

  const recordPayment = useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string;
      data: {
        paymentDate: string;
        paymentMethod: string;
        amountPaid: number;
        referenceNo?: string;
        note?: string;
      };
    }) => invoiceApiService.RecordPayment(invoiceId, data),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
  });

  return { recordPayment };
};
