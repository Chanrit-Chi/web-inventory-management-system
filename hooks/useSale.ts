import { saleApiService } from "@/lib/services/client/saleApiService";
import { OrderUpdate, OrderWithDetails } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetSales = () =>
  useQuery({ queryKey: ["sales"], queryFn: saleApiService.GetSales });

export const useGetSaleById = (id: number) =>
  useQuery({
    queryKey: ["sales", id],
    queryFn: () => saleApiService.GetSaleById(id),
    enabled: !!id,
  });

export const useAddSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OrderWithDetails) => saleApiService.AddSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: OrderUpdate) =>
      saleApiService.UpdateSale(id, data),
    onSuccess: (_, sale) => {
      // Invalidate both the list and the specific sale
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sales", sale.id] });
    },
  });
};
