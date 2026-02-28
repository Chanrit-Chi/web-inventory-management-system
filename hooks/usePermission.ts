import { useSession } from "@/lib/auth-client";
import { hasPermission, Permission } from "@/lib/rbac";
import type { Role } from "@prisma/client";

/**
 * Client-side permission hook.
 * Reads the current user's role from the session and exposes a `can()` helper
 * that mirrors the server-side `hasPermission()` check.
 */
export function usePermission() {
  const { data: session, isPending } = useSession();
  const role = (session?.user as { role?: Role } | undefined)?.role;

  function can(permission: Permission): boolean {
    if (!role) return false;
    return hasPermission(role, permission);
  }

  return { can, isPending, role };
}
