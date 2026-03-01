"use client";

import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/lib/rbac";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

/**
 * Client-side permission guard component.
 * Use this in client components to protect content based on permissions.
 */
export default function ClientPermissionGuard({
  permission,
  children,
  fallback,
}: Readonly<{
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}>) {
  const { can, isPending } = usePermission();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !can(permission)) {
      router.push("/unauthorized");
    }
  }, [can, permission, isPending, router]);

  if (isPending) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="size-8" />
        </div>
      )
    );
  }

  if (!can(permission)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
