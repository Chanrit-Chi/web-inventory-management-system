import { saleApiService } from "@/lib/services/client/saleApiService";
import { OrderUpdate, OrderWithDetails } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query hooks
export const useGetSales = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: Record<string, string>
) =>
  useQuery({
    queryKey: ["sales", page, limit, search, filters],
    queryFn: () => saleApiService.GetSales(page, limit, search, filters),
  });

export const useGetSaleById = (id: number) =>
  useQuery({
    queryKey: ["sales", id],
    queryFn: () => saleApiService.GetSaleById(id),
    enabled: !!id,
  });

// Mutation hooks - centralized queryClient
export const useSaleMutations = () => {
  const queryClient = useQueryClient();

  const addSale = useMutation({
    mutationFn: (data: OrderWithDetails) => saleApiService.AddSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  const updateSale = useMutation({
    mutationFn: ({ id, ...data }: OrderUpdate) =>
      saleApiService.UpdateSale(id, data as OrderWithDetails),
    onSuccess: (_, sale) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales", sale.id] });
    },
  });

  return { addSale, updateSale };
};
