import { unitApiService } from "@/lib/services/client/unitApiService";
import { Unit, UnitUpdate } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetUnits = () =>
  useQuery<Unit[]>({
    queryKey: ["units"],
    queryFn: unitApiService.fetchUnits,
  });

export const useGetUnitById = (id: number | null | undefined) =>
  useQuery<Unit>({
    queryKey: ["unit", id],
    queryFn: () => unitApiService.fetchUnitById(id!),
    enabled: id != null,
  });

export const useUnitMutations = () => {
  const queryClient = useQueryClient();

  const addUnit = useMutation({
    mutationFn: unitApiService.addUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });

  const updateUnit = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UnitUpdate }) =>
      unitApiService.updateUnit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["unit", id] });
    },
  });

  const deleteUnit = useMutation({
    mutationFn: (id: number) => unitApiService.deleteUnit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["unit", id] });
    },
  });

  return { addUnit, updateUnit, deleteUnit };
};
