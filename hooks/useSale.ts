import { saleApiService } from "@/lib/services/client/saleApiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useSale = () =>
  useQuery({ queryKey: ["sales"], queryFn: saleApiService.GetSales });

export const useAddSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saleApiService.AddSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};
