import { quotationApiService } from "@/lib/services/client/quotationApiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetQuotations = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: Record<string, string>,
) =>
  useQuery({
    queryKey: ["quotations", page, limit, search, filters],
    queryFn: () => quotationApiService.fetchQuotations(page, limit, search, filters),
  });

export const useGetQuotationById = (id: string) =>
  useQuery({
    queryKey: ["quotations", id],
    queryFn: () => quotationApiService.fetchQuotationById(id),
    enabled: !!id,
  });

export const useQuotationMutations = () => {
  const queryClient = useQueryClient();

  const addQuotation = useMutation({
    mutationFn: quotationApiService.createQuotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  const updateQuotation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      quotationApiService.updateQuotation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  const deleteQuotation = useMutation({
    mutationFn: (id: string) => quotationApiService.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  const convertToSale = useMutation({
    mutationFn: ({ id, paymentMethodId }: { id: string; paymentMethodId: number }) =>
      quotationApiService.convertToOrder(id, paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  return {
    addQuotation,
    updateQuotation,
    deleteQuotation,
    convertToSale,
  };
};
