import { productApiService } from "@/lib/services/client/productApiService";
import {
  ProductUpdate,
  ProductCreateRequest,
} from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query hooks
export const useGetProducts = (
  page: number,
  limit: number,
  search?: string,
  filters?: Record<string, string>,
) =>
  useQuery({
    queryKey: ["products", page, limit, search, filters],
    queryFn: () =>
      productApiService.fetchProducts(page, limit, search, filters),
  });

export const useGetProductById = (id: string) =>
  useQuery({
    queryKey: ["products", id],
    queryFn: () => productApiService.fetchProductById(id),
    enabled: !!id,
  });

// Mutation hooks - centralized queryClient
export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const addProduct = useMutation({
    mutationFn: (data: ProductCreateRequest) =>
      productApiService.addProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      productApiService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productApiService.deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const reactivateProduct = useMutation({
    mutationFn: (id: string) => productApiService.reactivateProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return { addProduct, updateProduct, deleteProduct, reactivateProduct };
};
