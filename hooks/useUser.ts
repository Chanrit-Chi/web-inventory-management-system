import { userApiService } from "@/lib/services/client/userApiService";
import { User, UserUpdate } from "@/schemas/type-export.schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetUsers = () =>
  useQuery<User[]>({
    queryKey: ["users"],
    queryFn: userApiService.fetchUsers,
  });

export const useGetUserById = (id: string | null | undefined) =>
  useQuery<User>({
    queryKey: ["user", id],
    queryFn: () => userApiService.fetchUserById(id!),
    enabled: id != null,
  });

export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const addUser = useMutation({
    mutationFn: userApiService.addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdate }) =>
      userApiService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => userApiService.deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });

  const reactivateUser = useMutation({
    mutationFn: (id: string) => userApiService.reactivateUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
    },
  });

  return { addUser, updateUser, deleteUser, reactivateUser };
};
