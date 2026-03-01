import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/getServerSession";
import { hasPermissionDB } from "@/lib/rbac-db";

/**
 * Server-side permission guard (database-driven).
 * Call at the top of a server component (layout.tsx) or API route to protect a route.
 * Redirects to /unauthorized if the user lacks the required permission.
 *
 * This version checks permissions from the database, supporting:
 * - Custom permission groups
 * - User-specific overrides
 * - Permission expiry
 */
export async function requirePermissionDB(permission: string) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/user_auth");
  }

  const userId = session.user.id;

  if (!userId || !(await hasPermissionDB(userId, permission))) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * API route version that throws errors instead of redirecting
 */
export async function requirePermissionDBForAPI(permission: string) {
  const session = await getServerSession();

  if (!session?.user) {
    throw new Error("Unauthorized: Not authenticated");
  }

  const userId = session.user.id;

  if (!userId || !(await hasPermissionDB(userId, permission))) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }

  return session;
}
