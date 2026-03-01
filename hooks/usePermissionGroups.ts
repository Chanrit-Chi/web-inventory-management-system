import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Role } from "@prisma/client";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  category: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  isDefault: boolean;
  baseRole: Role | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{
    id: string;
    permission: Permission;
  }>;
  _count: {
    users: number;
  };
  effectiveUserCount?: number;
}

/**
 * Fetch all permission groups
 */
export const usePermissionGroups = () =>
  useQuery<PermissionGroup[]>({
    queryKey: ["permission-groups"],
    queryFn: async () => {
      const response = await fetch("/api/permission-groups");
      if (!response.ok) {
        throw new Error("Failed to fetch permission groups");
      }
      const result = await response.json();
      return result.data;
    },
  });

/**
 * Fetch a single permission group by ID
 */
export const usePermissionGroup = (id: string | null | undefined) =>
  useQuery<PermissionGroup>({
    queryKey: ["permission-group", id],
    queryFn: async () => {
      const response = await fetch(`/api/permission-groups/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch permission group");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: id != null,
  });

/**
 * Fetch permissions for a specific group
 */
export const useGroupPermissions = (groupId: string | null | undefined) =>
  useQuery<Permission[]>({
    queryKey: ["permission-group", groupId, "permissions"],
    queryFn: async () => {
      const response = await fetch(
        `/api/permission-groups/${groupId}/permissions`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch group permissions");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: groupId != null,
  });

/**
 * Permission group mutations
 */
export const usePermissionGroupMutations = () => {
  const queryClient = useQueryClient();

  const createGroup = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      priority?: number;
      baseRole?: Role | null;
      permissionIds?: string[];
    }) => {
      const response = await fetch("/api/permission-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create permission group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permission-groups"] });
      toast.success("Permission group created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        priority?: number;
        baseRole?: Role | null;
      };
    }) => {
      const response = await fetch(`/api/permission-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permission group");
      }
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["permission-groups"] });
      queryClient.invalidateQueries({ queryKey: ["permission-group", id] });
      toast.success("Permission group updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/permission-groups/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete permission group");
      }
      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["permission-groups"] });
      queryClient.invalidateQueries({ queryKey: ["permission-group", id] });
      toast.success("Permission group deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateGroupPermissions = useMutation({
    mutationFn: async ({
      groupId,
      permissionIds,
    }: {
      groupId: string;
      permissionIds: string[];
    }) => {
      const response = await fetch(
        `/api/permission-groups/${groupId}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionIds }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update group permissions");
      }
      return response.json();
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["permission-groups"] });
      queryClient.invalidateQueries({
        queryKey: ["permission-group", groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ["permission-group", groupId, "permissions"],
      });
      toast.success("Group permissions updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    updateGroupPermissions,
  };
};
