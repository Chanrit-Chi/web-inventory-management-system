import { quotationApiService } from "@/lib/services/client/quotationApiService";
import { QuotationWithItems } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetQuotations = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: Record<string, string>,
) =>
  useQuery({
    queryKey: ["quotations", page, limit, search, filters],
    queryFn: () =>
      quotationApiService.GetQuotations(page, limit, search, filters),
  });

export const useGetQuotationById = (id: string) =>
  useQuery({
    queryKey: ["quotations", id],
    queryFn: () => quotationApiService.GetQuotationById(id),
    enabled: !!id,
  });

export const useQuotationMutations = () => {
  const queryClient = useQueryClient();

  const addQuotation = useMutation({
    mutationFn: (data: QuotationWithItems) =>
      quotationApiService.AddQuotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  const updateQuotation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Partial<QuotationWithItems>) =>
      quotationApiService.UpdateQuotation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations", variables.id] });
    },
  });

  const convertToSale = useMutation({
    mutationFn: ({
      id,
      paymentMethodId,
    }: {
      id: string;
      paymentMethodId: number;
    }) => quotationApiService.ConvertToSale(id, paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  return { addQuotation, updateQuotation, convertToSale };
};
