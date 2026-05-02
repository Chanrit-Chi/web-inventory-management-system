"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Role } from "@prisma/client";

import { User, UserUpdate } from "@/schemas/type-export.schema";
import { BaseDialog } from "@/components/dialog-template";
import { useUserMutations, useGetUserById } from "@/hooks/useUser";
import { usePermissionGroups } from "@/hooks/usePermissionGroups";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";

export function UpdateUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { updateUser } = useUserMutations();
  const { data: userData } = useGetUserById(user.id);
  const { data: permissionGroups, isPending: loadingGroups } =
    usePermissionGroups();
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;
  const isCurrentUser = session?.user?.id === user.id;
  const isSuperAdminSelfEdit = isSuperAdmin && isCurrentUser;

  // Filter permission groups based on role hierarchy and exclude default groups
  const filteredPermissionGroups = useMemo(() => {
    if (!permissionGroups) return [];

    return permissionGroups.filter((group) => {
      // Hide default groups as they are represented by "Base Role" items
      if (group.isDefault) return false;

      // Hierarchy check: ADMIN users cannot see/assign SUPER_ADMIN groups
      if (isSuperAdmin) return true;
      return (
        group.baseRole !== Role.SUPER_ADMIN && group.name !== "SUPER_ADMIN"
      );
    });
  }, [permissionGroups, isSuperAdmin]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<UserUpdate>({
    defaultValues: {
      name: userData?.name || user.name,
      email: userData?.email || user.email,
      role: userData?.role || user.role,
      permissionGroupId:
        userData?.permissionGroupId || user.permissionGroupId || null,
    },
  });

  const selectedPermissionGroupId = useWatch({
    control,
    name: "permissionGroupId",
  });
  const selectedRole = useWatch({ control, name: "role" });
  const selectedValue = selectedPermissionGroupId
    ? `group:${selectedPermissionGroupId}`
    : selectedRole;

  // Update form values when userData changes
  useEffect(() => {
    if (userData) {
      reset({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissionGroupId: userData.permissionGroupId || null,
      });
    }
  }, [userData, reset]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: UserUpdate) => {
    try {
      await updateUser.mutateAsync({ id: user.id, data });
      toast.success("User updated successfully");
      onOpenChange(false);
      reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Update User"
      description="Make changes to the user information"
      className="sm:max-w-112.5"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="update-name">Name</Label>
          <Input
            id="update-name"
            placeholder="Enter name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-email">Email</Label>
          <Input
            id="update-email"
            type="email"
            placeholder="Enter email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="update-role">Role / Permission Group</Label>
          <Select
            onValueChange={(value) => {
              if (isSuperAdminSelfEdit) {
                return;
              }
              // Check if it's a permission group (starts with "group:")
              if (value.startsWith("group:")) {
                const groupId = value.replace("group:", "");
                setValue("permissionGroupId", groupId);
                // Set role based on the group's base role or keep current
                const group = filteredPermissionGroups?.find(
                  (g) => g.id === groupId,
                );
                setValue("role", (group?.baseRole as Role) || user.role);
              } else {
                // It's a base role
                setValue("role", value as Role);
                setValue("permissionGroupId", null);
              }
            }}
            value={selectedValue}
            disabled={isSuperAdminSelfEdit}
          >
            <SelectTrigger id="update-role">
              <SelectValue placeholder="Select a role or permission group" />
            </SelectTrigger>
            <SelectContent>
              {/* Base Roles */}
              <SelectItem value={Role.SELLER}>Seller (Base Role)</SelectItem>
              <SelectItem value={Role.MANAGER}>Manager (Base Role)</SelectItem>
              <SelectItem value={Role.ADMIN}>Admin (Base Role)</SelectItem>
              {isSuperAdmin && (
                <SelectItem value={Role.SUPER_ADMIN}>
                  Super Admin (Base Role)
                </SelectItem>
              )}

              {/* Permission Groups */}
              {filteredPermissionGroups &&
                filteredPermissionGroups.length > 0 && (
                  <>
                    <SelectSeparator />
                    {filteredPermissionGroups.map((group) => (
                      <SelectItem key={group.id} value={`group:${group.id}`}>
                        {group.name} (Custom Group)
                      </SelectItem>
                    ))}
                  </>
                )}
            </SelectContent>
          </Select>
          {loadingGroups && (
            <p className="text-xs text-muted-foreground">
              Loading permission groups...
            </p>
          )}
          {isSuperAdminSelfEdit && (
            <p className="text-xs text-muted-foreground">
              SUPER_ADMIN cannot edit their own role or permission group.
            </p>
          )}
          {errors.role && (
            <p className="text-xs text-red-500">{errors.role.message}</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={updateUser.isPending}
          >
            {updateUser.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Update User
          </Button>
        </div>
      </form>
    </BaseDialog>
  );
}
