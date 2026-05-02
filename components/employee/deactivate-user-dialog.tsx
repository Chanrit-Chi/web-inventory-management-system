"use client";

import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { User } from "@/schemas/type-export.schema";
import { ConfirmDialog } from "@/components/dialog-template";
import { useUserMutations, useGetUsers } from "@/hooks/useUser";
import { useSession } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DeactivateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { deleteUser } = useUserMutations();
  const { data: session } = useSession();
  const { data: allUsers } = useGetUsers();

  const isCurrentUser = session?.user?.id === user.id;
  const activeAdmins =
    allUsers?.filter(
      (u) => (u.role === "ADMIN" || u.role === "SUPER_ADMIN") && u.isActive,
    ) || [];
  const activeSuperAdmins =
    allUsers?.filter((u) => u.role === "SUPER_ADMIN" && u.isActive) || [];

  const isLastSuperAdmin =
    user.role === "SUPER_ADMIN" && activeSuperAdmins.length === 1;
  const isLastAdmin =
    user.role === "ADMIN" &&
    activeAdmins.length === 1 &&
    activeSuperAdmins.length === 0;

  const handleDeactivate = async () => {
    // Double-check on submit
    if (isCurrentUser) {
      toast.error("You cannot deactivate yourself");
      return;
    }

    if (isLastAdmin || isLastSuperAdmin) {
      toast.error(
        "Cannot deactivate the last administrator/super-admin in the system",
      );
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
      toast.success("User deactivated successfully");
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to deactivate user";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<User>
      open={open}
      onOpenChange={onOpenChange}
      title="Deactivate User"
      description="Are you sure you want to deactivate this user? They will no longer be able to log in."
      item={user}
      renderItem={(u) => (
        <div className="space-y-4">
          {/* Warning for admin users */}
          {(u.role === "ADMIN" || u.role === "SUPER_ADMIN") && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> You are about to deactivate an{" "}
                {u.role} user!
                {(isLastAdmin || isLastSuperAdmin) &&
                  " This is the last active admin/super-admin in the system."}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-semibold">User Name:</p>
            <p className="text-sm">{u.name}</p>
            <p className="text-sm font-semibold mt-2">Email:</p>
            <p className="text-sm">{u.email}</p>
            <p className="text-sm font-semibold mt-2">Role:</p>
            <p className="text-sm">{u.role}</p>
          </div>
        </div>
      )}
      onConfirm={handleDeactivate}
      confirmLabel="Deactivating"
      isLoading={deleteUser.isPending}
      confirmDisabled={isLastAdmin || isLastSuperAdmin || isCurrentUser}
    />
  );
}
