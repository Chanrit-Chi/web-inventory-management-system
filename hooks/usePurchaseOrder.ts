import { purchaseOrderApiService } from "@/lib/services/client/purchaseOrderApiService";
import { PurchaseOrderWithDetails } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetPurchaseOrders = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: Record<string, string>,
) =>
  useQuery({
    queryKey: ["purchase-orders", page, limit, search, filters],
    queryFn: () =>
      purchaseOrderApiService.GetPurchaseOrders(page, limit, search, filters),
  });

export const useGetPurchaseOrderById = (id: number) =>
  useQuery({
    queryKey: ["purchase-order", id],
    queryFn: () => purchaseOrderApiService.GetPurchaseOrderById(id),
    enabled: !!id,
  });

export const usePurchaseOrderMutations = () => {
  const queryClient = useQueryClient();

  const addPurchaseOrder = useMutation({
    mutationFn: (data: PurchaseOrderWithDetails) =>
      purchaseOrderApiService.AddPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  const updatePurchaseOrder = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<PurchaseOrderWithDetails>;
    }) => purchaseOrderApiService.UpdatePurchaseOrder(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
  });

  const deletePurchaseOrder = useMutation({
    mutationFn: (id: number) => purchaseOrderApiService.DeletePurchaseOrder(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
    },
  });

  return { addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder };
};
