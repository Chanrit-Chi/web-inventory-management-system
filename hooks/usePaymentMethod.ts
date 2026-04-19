import { paymentMethodApiService } from "@/lib/services/client/paymentMethodApiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useGetPaymentMethods = () =>
  useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => paymentMethodApiService.GetPaymentMethods(),
  });

export const usePaymentMethodMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (name: string) => paymentMethodApiService.CreatePaymentMethod(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Payment method created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create payment method");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      paymentMethodApiService.UpdatePaymentMethod(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Payment method updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update payment method");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => paymentMethodApiService.DeletePaymentMethod(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      toast.success("Payment method deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete payment method");
    },
  });

  return {
    createPaymentMethod: createMutation.mutateAsync,
    updatePaymentMethod: updateMutation.mutateAsync,
    deletePaymentMethod: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
