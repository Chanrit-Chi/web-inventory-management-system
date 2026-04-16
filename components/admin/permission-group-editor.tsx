"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepperInput } from "@/components/ui/stepper-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionMatrix } from "./permission-matrix";
import {
  usePermissionGroup,
  useGroupPermissions,
  usePermissionGroupMutations,
} from "@/hooks/usePermissionGroups";
import { usePermissions } from "@/hooks/usePermissions";
import { useCurrentUserPermissions } from "@/hooks/useUserPermissionOverrides";
import { hasPermission, type Permission as PermissionType } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { AlertCircle, Save } from "lucide-react";
import { useSession } from "@/lib/auth-client";

const groupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priority: z.number().min(1).max(100),
  baseRole: z
    .enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "SELLER"])
    .nullable()
    .optional(),
  isDefault: z.boolean().optional(),
});

type GroupFormData = z.infer<typeof groupSchema>;

function areSamePermissionIds(current: string[], next: string[]) {
  if (current.length !== next.length) return false;
  const currentSorted = [...current].sort((left, right) =>
    left.localeCompare(right),
  );
  const nextSorted = [...next].sort((left, right) => left.localeCompare(right));

  for (let index = 0; index < currentSorted.length; index++) {
    if (currentSorted[index] !== nextSorted[index]) return false;
  }

  return true;
}

interface PermissionGroupEditorProps {
  readonly groupId?: string; // If undefined, create mode
  readonly onSaved?: () => void;
  readonly onCancel?: () => void;
}

export function PermissionGroupEditor({
  groupId,
  onSaved,
  onCancel,
}: Readonly<PermissionGroupEditorProps>) {
  const isEditMode = Boolean(groupId);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: group, isPending: loadingGroup } = usePermissionGroup(
    groupId || "",
  );
  const { data: groupPermissions, isPending: loadingPermissions } =
    useGroupPermissions(groupId || "");
  const { data: allPermissions } = usePermissions();
  const { createGroup, updateGroup, updateGroupPermissions } =
    usePermissionGroupMutations();
  const { data: session } = useSession();
  const { data: currentUserPermissions } = useCurrentUserPermissions();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;

  const assignablePermissionNames = useMemo(() => {
    if (isSuperAdmin) {
      return null;
    }

    return new Set(
      (currentUserPermissions || []).map((permission) => permission.name),
    );
  }, [currentUserPermissions, isSuperAdmin]);

  const assignablePermissionIds = useMemo(() => {
    const allowed = new Set<string>();

    if (!allPermissions) {
      return allowed;
    }

    if (isSuperAdmin) {
      for (const permission of allPermissions) {
        allowed.add(permission.id);
      }
      return allowed;
    }

    for (const permission of allPermissions) {
      if (assignablePermissionNames?.has(permission.name as PermissionType)) {
        allowed.add(permission.id);
      }
    }

    return allowed;
  }, [allPermissions, assignablePermissionNames, isSuperAdmin]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: 50,
      baseRole: undefined,
      isDefault: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (group) {
      setValue("name", group.name);
      setValue("description", group.description || "");
      setValue("priority", group.priority);
      setValue(
        "baseRole",
        (group.baseRole ?? undefined) as GroupFormData["baseRole"],
      );
      setValue("isDefault", group.isDefault);
    }
  }, [group, setValue]);

  const selectedBaseRole = watch("baseRole");

  // Populate selected permissions from loaded group data
  // This synchronizes external data (group permissions) into local state
  useEffect(() => {
    if (groupPermissions) {
      const nextSelection = groupPermissions
        .filter((permission) =>
          isSuperAdmin ? true : assignablePermissionIds.has(permission.id),
        )
        .map((permission) => permission.id);

      setSelectedPermissions((currentSelection) =>
        areSamePermissionIds(currentSelection, nextSelection)
          ? currentSelection
          : nextSelection,
      );
    }
  }, [groupPermissions, isSuperAdmin, assignablePermissionIds]);

  // Auto-populate permissions when base role changes
  const handleBaseRoleChange = (role: string) => {
    setValue("baseRole", role as GroupFormData["baseRole"]);

    // Get permissions for this role
    if (allPermissions && role) {
      const rolePermissions = allPermissions.filter((perm) => {
        const permissionName =
          `${perm.resource}:${perm.action}` as PermissionType;
        return hasPermission(role as Role, permissionName);
      });

      const nextSelection = rolePermissions
        .map((permission) => permission.id)
        .filter((permissionId) =>
          isSuperAdmin ? true : assignablePermissionIds.has(permissionId),
        );

      // Set selected permissions to role's permissions
      setSelectedPermissions((currentSelection) =>
        areSamePermissionIds(currentSelection, nextSelection)
          ? currentSelection
          : nextSelection,
      );
    }
  };

  const onSubmit = async (data: GroupFormData) => {
    try {
      setSubmitError(null);

      const permissionIdsToSave = isSuperAdmin
        ? selectedPermissions
        : selectedPermissions.filter((permissionId) =>
            assignablePermissionIds.has(permissionId),
          );

      const payload = {
        ...data,
        baseRole: data.baseRole ?? undefined,
      };

      if (isEditMode && groupId) {
        // Update existing group
        await updateGroup.mutateAsync({ id: groupId, data: payload });
        await updateGroupPermissions.mutateAsync({
          groupId,
          permissionIds: permissionIdsToSave,
        });
      } else {
        // Create new group
        const response = await createGroup.mutateAsync(payload);
        const newGroupId = response.data?.id || response.id;

        if (!newGroupId) {
          throw new Error("Failed to get new group ID");
        }

        await updateGroupPermissions.mutateAsync({
          groupId: newGroupId,
          permissionIds: permissionIdsToSave,
        });
      }
      onSaved?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Failed to save permission group",
      );
    }
  };

  if (isEditMode && loadingGroup) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Edit Permission Group" : "Create Permission Group"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Modify the group details and permissions"
            : "Create a custom permission group for your users"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Group Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Sales Team Lead"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <StepperInput
                id="priority"
                min={1}
                max={100}
                {...register("priority", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Higher priority (1-100) takes precedence when resolving
                conflicts
              </p>
              {errors.priority && (
                <p className="text-sm text-destructive">
                  {errors.priority.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this permission group"
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseRole">Base Role (Optional)</Label>
            <Select
              value={selectedBaseRole || undefined}
              onValueChange={handleBaseRoleChange}
            >
              <SelectTrigger id="baseRole">
                <SelectValue placeholder="Select a base role" />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && (
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                )}
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="SELLER">Seller</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optional: Selecting a base role will auto-populate permissions.
              You can then customize as needed.
            </p>
            {errors.baseRole && (
              <p className="text-sm text-destructive">
                {errors.baseRole.message}
              </p>
            )}
          </div>

          {/* Permissions Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">Permissions</Label>
              <Badge variant="outline">
                {selectedPermissions.length} selected
              </Badge>
            </div>
            {loadingPermissions ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <PermissionMatrix
                selectedPermissions={selectedPermissions}
                onChange={(permissionIds) => {
                  const nextSelection = isSuperAdmin
                    ? permissionIds
                    : permissionIds.filter((permissionId) =>
                        assignablePermissionIds.has(permissionId),
                      );

                  setSelectedPermissions((currentSelection) =>
                    areSamePermissionIds(currentSelection, nextSelection)
                      ? currentSelection
                      : nextSelection,
                  );
                }}
              />
            )}
          </div>

          {selectedPermissions.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This group has no permissions selected. Users assigned to this
                group will only have permissions from their base role.
              </AlertDescription>
            </Alert>
          )}

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={
              createGroup.isPending ||
              updateGroup.isPending ||
              updateGroupPermissions.isPending
            }
            className="ml-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            {isEditMode ? "Save Changes" : "Create Group"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
