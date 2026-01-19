import { categoryApiService } from "@/lib/services/client/categoryApiService";
import { CategoryCreate } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: categoryApiService.fetchCategories,
  });

export const useGetCategoryById = (id: number | null | undefined) =>
  useQuery({
    queryKey: ["category", id],
    queryFn: () => categoryApiService.fetchCategoryById(id!),
    enabled: id != null,
  });

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();

  const addCategory = useMutation({
    mutationFn: categoryApiService.addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryCreate }) =>
      categoryApiService.updateCategory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: number) => categoryApiService.deleteCategory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", id] });
    },
  });

  return { addCategory, updateCategory, deleteCategory };
};
