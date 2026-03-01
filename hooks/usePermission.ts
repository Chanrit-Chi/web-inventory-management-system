import { useSession } from "@/lib/auth-client";
import { hasPermission, Permission } from "@/lib/rbac";
import type { Role } from "@prisma/client";
import { useUserEffectivePermissions } from "./useUserPermissionOverrides";

// Feature flag: Set to true to use database-driven permissions
const USE_DB_PERMISSIONS =
  process.env.NEXT_PUBLIC_USE_DB_PERMISSIONS === "true";

/**
 * Client-side permission hook.
 * Reads the current user's role from the session and exposes a `can()` helper
 * that mirrors the server-side `hasPermission()` check.
 *
 * When USE_DB_PERMISSIONS is enabled, checks against database permissions
 * (supporting custom groups and user overrides).
 */
export function usePermission() {
  const { data: session, isPending: sessionPending } = useSession();
  const userId = session?.user?.id;
  const role = (session?.user as { role?: Role } | undefined)?.role;

  // Fetch database permissions if feature flag is enabled
  const { data: dbPermissions, isPending: dbPending } =
    useUserEffectivePermissions(USE_DB_PERMISSIONS ? userId : null);

  const isPending = sessionPending || (USE_DB_PERMISSIONS && dbPending);

  function can(permission: Permission): boolean {
    if (!session?.user) return false;

    // Use database permissions if enabled and loaded
    if (USE_DB_PERMISSIONS) {
      if (!dbPermissions) return false;
      return dbPermissions.some((p) => p.name === permission);
    }

    // Fall back to legacy role-based permissions
    if (!role) return false;
    return hasPermission(role, permission);
  }

  return { can, isPending, role, useDbPermissions: USE_DB_PERMISSIONS };
}
