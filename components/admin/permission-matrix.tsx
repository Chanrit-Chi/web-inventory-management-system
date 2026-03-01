"use client";

import { usePermissionsGroupedByResource } from "@/hooks/usePermissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PermissionMatrixProps {
  readonly selectedPermissions: string[];
  readonly onChange: (permissionIds: string[]) => void;
  readonly readOnly?: boolean;
  readonly disabledPermissionIds?: string[];
}

export function PermissionMatrix({
  selectedPermissions,
  onChange,
  readOnly = false,
  disabledPermissionIds = [],
}: Readonly<PermissionMatrixProps>) {
  const {
    data: groupedPermissions,
    permissions,
    isPending,
    error,
  } = usePermissionsGroupedByResource();

  const actions = ["create", "read", "update", "delete"];
  const disabledPermissionSet = new Set(disabledPermissionIds);

  const togglePermission = (permissionId: string) => {
    if (readOnly || disabledPermissionSet.has(permissionId)) return;

    if (selectedPermissions.includes(permissionId)) {
      onChange(selectedPermissions.filter((id) => id !== permissionId));
    } else {
      onChange([...selectedPermissions, permissionId]);
    }
  };

  const toggleResource = (resource: string) => {
    if (readOnly || !groupedPermissions) return;

    const resourcePermissions = groupedPermissions[resource] || [];
    const resourcePermIds = resourcePermissions
      .map((p) => p.id)
      .filter((permissionId) => !disabledPermissionSet.has(permissionId));

    if (resourcePermIds.length === 0) return;

    const allSelected = resourcePermIds.every((id) =>
      selectedPermissions.includes(id),
    );

    if (allSelected) {
      // Deselect all
      onChange(
        selectedPermissions.filter((id) => !resourcePermIds.includes(id)),
      );
    } else {
      // Select all
      const newSelection = [...selectedPermissions];
      resourcePermIds.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      onChange(newSelection);
    }
  };

  const toggleAction = (action: string) => {
    if (readOnly || !permissions) return;

    const actionPermissions = permissions
      .filter((p) => p.action === action)
      .filter((permission) => !disabledPermissionSet.has(permission.id));

    if (actionPermissions.length === 0) return;

    const actionPermIds = actionPermissions.map((p) => p.id);
    const allSelected = actionPermIds.every((id) =>
      selectedPermissions.includes(id),
    );

    if (allSelected) {
      // Deselect all
      onChange(selectedPermissions.filter((id) => !actionPermIds.includes(id)));
    } else {
      // Select all
      const newSelection = [...selectedPermissions];
      actionPermIds.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      onChange(newSelection);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load permissions. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!groupedPermissions) {
    return null;
  }

  const resources = Object.keys(groupedPermissions).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-50">Resource</TableHead>
            {actions.map((action) => {
              const actionPerms =
                permissions
                  ?.filter((p) => p.action === action)
                  .filter(
                    (permission) => !disabledPermissionSet.has(permission.id),
                  ) || [];
              const hasSelectable = actionPerms.length > 0;
              const allSelected = actionPerms.every((p) =>
                selectedPermissions.includes(p.id),
              );

              return (
                <TableHead key={action} className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    {!readOnly && (
                      <Checkbox
                        checked={hasSelectable && allSelected}
                        onCheckedChange={() => toggleAction(action)}
                        disabled={!hasSelectable}
                      />
                    )}
                    <span className="capitalize">{action}</span>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => {
            const resourcePerms = groupedPermissions[resource] || [];
            const selectableResourcePerms = resourcePerms.filter(
              (permission) => !disabledPermissionSet.has(permission.id),
            );
            const hasSelectable = selectableResourcePerms.length > 0;
            const allSelected =
              hasSelectable &&
              selectableResourcePerms.every((p) =>
                selectedPermissions.includes(p.id),
              );

            return (
              <TableRow key={resource}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => toggleResource(resource)}
                        disabled={!hasSelectable}
                      />
                    )}
                    <span className="font-medium capitalize">
                      {resource.replaceAll("_", " ")}
                    </span>
                  </div>
                </TableCell>
                {actions.map((action) => {
                  const permission = resourcePerms.find(
                    (p) => p.action === action,
                  );
                  const isSelected = permission
                    ? selectedPermissions.includes(permission.id)
                    : false;
                  const isDisabled = permission
                    ? disabledPermissionSet.has(permission.id)
                    : false;

                  return (
                    <TableCell key={action} className="text-center">
                      {permission ? (
                        <div className="flex justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              togglePermission(permission.id)
                            }
                            disabled={readOnly || isDisabled}
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="p-3 border-t bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selectedPermissions.length} permission
            {selectedPermissions.length === 1 ? "" : "s"} selected
          </span>
          {!readOnly && (
            <span className="text-xs">
              Tip: Click row/column headers to select all
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
