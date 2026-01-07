import { customerApiService } from "@/lib/services/client/customerApiService";
import { Customer } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetCustomers = () =>
  useQuery({
    queryKey: ["customers"],
    queryFn: customerApiService.GetCustomers,
  });

export const useGetCustomerById = (id: string) =>
  useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerApiService.GetCustomerById(id),
  });

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerApiService.AddCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      customer,
    }: {
      id: string;
      customer: Partial<Customer>;
    }) => customerApiService.UpdateCustomer(id, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerApiService.DeleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
