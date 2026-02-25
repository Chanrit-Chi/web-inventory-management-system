import { supplierApiService } from "@/lib/services/client/supplierApiService";
import { SupplierCreate, SupplierUpdate } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetSuppliers = (
  page: number = 1,
  limit: number = 10,
  search?: string,
) =>
  useQuery({
    queryKey: ["suppliers", page, limit, search],
    queryFn: () => supplierApiService.GetSuppliers(page, limit, search),
  });

export const useGetAllSuppliers = () =>
  useQuery({
    queryKey: ["suppliers", "all"],
    queryFn: () => supplierApiService.GetAllSuppliers(),
  });

export const useGetSupplierById = (id: string) =>
  useQuery({
    queryKey: ["supplier", id],
    queryFn: () => supplierApiService.GetSupplierById(id),
    enabled: !!id,
  });

export const useSupplierMutations = () => {
  const queryClient = useQueryClient();

  const addSupplier = useMutation({
    mutationFn: (data: SupplierCreate) => supplierApiService.AddSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SupplierUpdate }) =>
      supplierApiService.UpdateSupplier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", id] });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: (id: string) => supplierApiService.DeleteSupplier(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", id] });
    },
  });

  return { addSupplier, updateSupplier, deleteSupplier };
};
