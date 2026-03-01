import { useQuery } from "@tanstack/react-query";

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  permissionId: string | null;
  permissionName: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  createdBy: string;
  createdByUser: {
    id: string;
    name: string;
    email: string;
  };
  permission: {
    id: string;
    name: string;
    resource: string;
    action: string;
  } | null;
}

interface AuditLogFilters {
  targetType?: string;
  targetId?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

/**
 * Fetch permission audit logs with optional filters
 */
export const usePermissionAudit = (filters?: AuditLogFilters) => {
  const params = new URLSearchParams();

  if (filters?.targetType) params.append("targetType", filters.targetType);
  if (filters?.targetId) params.append("targetId", filters.targetId);
  if (filters?.createdBy) params.append("createdBy", filters.createdBy);
  if (filters?.startDate)
    params.append("startDate", filters.startDate.toISOString());
  if (filters?.endDate) params.append("endDate", filters.endDate.toISOString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.offset) params.append("offset", filters.offset.toString());

  return useQuery<AuditLogsResponse>({
    queryKey: ["permission-audit", filters],
    queryFn: async () => {
      const queryString = params.toString();
      const url = queryString
        ? `/api/permission-audit?${queryString}`
        : "/api/permission-audit";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }
      const result = await response.json();
      return {
        logs: result.data,
        total: result.meta.total,
      };
    },
  });
};

/**
 * Fetch audit logs for a specific user
 */
export const useUserAuditLogs = (
  userId: string | null | undefined,
  limit = 50,
) =>
  usePermissionAudit(
    userId
      ? {
          targetType: "user",
          targetId: userId,
          limit,
        }
      : undefined,
  );

/**
 * Fetch audit logs for a specific group
 */
export const useGroupAuditLogs = (
  groupId: string | null | undefined,
  limit = 50,
) =>
  usePermissionAudit(
    groupId
      ? {
          targetType: "group",
          targetId: groupId,
          limit,
        }
      : undefined,
  );
