import { customerApiService } from "@/lib/services/client/customerApiService";
import { CustomerCreate, CustomerUpdate } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query hooks
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

// Mutation hooks - centralized queryClient
export const useCustomerMutations = () => {
  const queryClient = useQueryClient();

  const addCustomer = useMutation({
    mutationFn: customerApiService.AddCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });

  const updateCustomer = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      customerApiService.UpdateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
    },
  });

  const deleteCustomer = useMutation({
    mutationFn: customerApiService.DeleteCustomer,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
    },
  });

  return { addCustomer, updateCustomer, deleteCustomer };
};
