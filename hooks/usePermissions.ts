import { useQuery } from "@tanstack/react-query";
import { PermissionCategory } from "@prisma/client";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  category: PermissionCategory;
  createdAt: Date;
}

/**
 * Fetch all permissions
 */
export const usePermissions = () =>
  useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await fetch("/api/permissions");
      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }
      const result = await response.json();
      return result.data;
    },
  });

/**
 * Fetch permissions by category
 */
export const usePermissionsByCategory = (category?: PermissionCategory) =>
  useQuery<Permission[]>({
    queryKey: ["permissions", "category", category],
    queryFn: async () => {
      const url = category
        ? `/api/permissions?category=${category}`
        : "/api/permissions";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch permissions");
      }
      const result = await response.json();
      return result.data;
    },
    enabled: category !== undefined,
  });

/**
 * Group permissions by resource for table display
 */
export const usePermissionsGroupedByResource = () => {
  const { data: permissions, ...rest } = usePermissions();

  const grouped = permissions?.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  return {
    ...rest,
    data: grouped,
    permissions,
  };
};
