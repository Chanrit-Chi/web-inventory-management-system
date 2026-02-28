import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getServerSession } from "@/lib/getServerSession";
import { hasPermission, Permission } from "@/lib/rbac";

/**
 * Server-side permission guard.
 * Call at the top of a server component (layout.tsx) to protect a route.
 * Redirects to /unauthorized if the user lacks the required permission.
 */
export async function requirePermission(permission: Permission) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/user_auth");
  }

  const role = (session.user as { role?: Role }).role;

  if (!role || !hasPermission(role, permission)) {
    redirect("/unauthorized");
  }

  return session;
}
