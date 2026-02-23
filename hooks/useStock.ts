import { stockApiService } from "@/lib/services/client/stockApiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StockMovementType } from "@prisma/client";
import { toast } from "sonner";

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      variantId: number;
      movementType: StockMovementType;
      quantity: number;
      reason?: string;
      createdBy?: string;
    }) => stockApiService.AdjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      toast.success("Stock adjusted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to adjust stock");
    },
  });
};

export const useGetStockMovements = (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  movementType?: StockMovementType,
  variantId?: number,
) => {
  return useQuery({
    queryKey: [
      "stock-movements",
      page,
      pageSize,
      search,
      movementType,
      variantId,
    ],
    queryFn: () =>
      stockApiService.GetStockMovements(
        page,
        pageSize,
        search,
        movementType,
        variantId,
      ),
  });
};

export const useBulkAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      adjustments: Array<{
        variantId: number;
        movementType: StockMovementType;
        quantity: number;
        reason?: string;
        createdBy?: string;
      }>;
    }) => stockApiService.BulkAdjustStock(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      toast.success(data.message || "Bulk stock adjusted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to perform bulk adjustment");
    },
  });
};
