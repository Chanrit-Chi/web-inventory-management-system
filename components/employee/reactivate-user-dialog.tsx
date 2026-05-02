"use client";

import { toast } from "sonner";
import { User } from "@/schemas/type-export.schema";
import { ConfirmDialog } from "@/components/dialog-template";
import { useUserMutations } from "@/hooks/useUser";

export function ReactivateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { reactivateUser } = useUserMutations();

  const handleReactivate = async () => {
    try {
      await reactivateUser.mutateAsync(user.id);
      toast.success("User reactivated successfully");
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reactivate user";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <ConfirmDialog<User>
      open={open}
      onOpenChange={onOpenChange}
      title="Reactivate User"
      description="Are you sure you want to reactivate this user? They will be able to log in again."
      item={user}
      renderItem={(u) => (
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm font-semibold">User Name:</p>
          <p className="text-sm">{u.name}</p>
          <p className="text-sm font-semibold mt-2">Email:</p>
          <p className="text-sm">{u.email}</p>
          <p className="text-sm font-semibold mt-2">Role:</p>
          <p className="text-sm">{u.role}</p>
        </div>
      )}
      onConfirm={handleReactivate}
      confirmLabel="Reactivating"
      isLoading={reactivateUser.isPending}
    />
  );
}
