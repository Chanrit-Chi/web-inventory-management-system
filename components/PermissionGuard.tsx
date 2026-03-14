import { requirePermissionDB } from "@/lib/requirePermissionDB";
import { Permission } from "@/lib/rbac";

/**
 * Reusable server component that guards a route by permission.
 * Place in layout.tsx for any protected route.
 */
export default async function PermissionGuard({
  permission,
  children,
}: Readonly<{
  permission: Permission;
  children: React.ReactNode;
}>) {
  await requirePermissionDB(permission);
  return <>{children}</>;
}
