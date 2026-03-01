import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  category: string;
}

interface UserPermissionOverride {
  id: string;
  userId: string;
  permissionId: string;
  permission: Permission;
  granted: boolean;
  reason: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
}

interface EffectivePermission extends Permission {
  source: "role" | "group" | "override";
  role?: string;
  groupName?: string;
  granted?: boolean;
  reason?: string | null;
  expiresAt?: Date | null;
}

/**
 * Fetch user permission overrides
 */
export const useUserPermissionOverrides = (userId: string | null | undefined) =>
  useQuery<UserPermissionOverride[]>({
    queryKey: ["user-permissions", userId, "overrides"],
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${userId}/permissions?type=overrides`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user permission overrides");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: userId != null,
  });

/**
 * Fetch user effective permissions (computed from role + group + overrides)
 */
export const useUserEffectivePermissions = (
  userId: string | null | undefined,
) =>
  useQuery<EffectivePermission[]>({
    queryKey: ["user-permissions", userId, "effective"],
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${userId}/permissions?type=effective`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user effective permissions");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: userId != null,
  });

/**
 * Fetch current user's effective permissions (convenience hook)
 */
export const useCurrentUserPermissions = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  return useUserEffectivePermissions(userId);
};

/**
 * User permission override mutations
 */
export const useUserPermissionMutations = () => {
  const queryClient = useQueryClient();

  const grantPermission = useMutation({
    mutationFn: async ({
      userId,
      permissionId,
      reason,
      expiresAt,
    }: {
      userId: string;
      permissionId: string;
      reason?: string;
      expiresAt?: Date;
    }) => {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          permissionId,
          reason,
          expiresAt: expiresAt?.toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to grant permission");
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  const grantPermissionsBulk = useMutation({
    mutationFn: async ({
      userId,
      permissionIds,
      reason,
      expiresAt,
    }: {
      userId: string;
      permissionIds: string[];
      reason?: string;
      expiresAt?: Date;
    }) => {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant_bulk",
          permissionIds,
          reason,
          expiresAt: expiresAt?.toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to grant permissions");
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  const revokePermission = useMutation({
    mutationFn: async ({
      userId,
      permissionId,
      reason,
    }: {
      userId: string;
      permissionId: string;
      reason?: string;
    }) => {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          permissionId,
          reason,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke permission");
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  const removeOverride = useMutation({
    mutationFn: async ({
      userId,
      permissionId,
    }: {
      userId: string;
      permissionId: string;
    }) => {
      const response = await fetch(
        `/api/users/${userId}/permissions?permissionId=${permissionId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove permission override");
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  const assignToGroup = useMutation({
    mutationFn: async ({
      userId,
      groupId,
    }: {
      userId: string;
      groupId: string | null;
    }) => {
      const response = await fetch(`/api/users/${userId}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_group",
          groupId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign user to group");
      }
      return response.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["permission-groups"] });
    },
  });

  return {
    grantPermission,
    grantPermissionsBulk,
    revokePermission,
    removeOverride,
    assignToGroup,
  };
};
