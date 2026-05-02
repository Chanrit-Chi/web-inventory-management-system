"use client";

import { toast } from "sonner";
import { User } from "@/schemas/type-export.schema";
import { BaseDialog } from "@/components/dialog-template";
import { useGetUsers } from "@/hooks/useUser";
import { useUserEffectivePermissions } from "@/hooks/useUserPermissionOverrides";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ViewUserDialog({
  user,
  open,
  onOpenChange,
}: {
  readonly user: User;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { data: allUsers } = useGetUsers();
  const {
    data: effectivePermissions,
    isPending: permissionsLoading,
    error: permissionsError,
  } = useUserEffectivePermissions(open ? user.id : undefined);

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return "N/A";
    const foundUser = allUsers?.find((u) => u.id === userId);
    return foundUser ? foundUser.name : userId.substring(0, 8);
  };

  const userDetails: Array<{ label: string; value: string }> = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Role", value: user.role },
    { label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
    { label: "Status", value: user.isActive ? "Active" : "Inactive" },
    { label: "Created At", value: new Date(user.createdAt).toLocaleString() },
    { label: "Created By", value: getUserName(user.createdBy) },
    { label: "Updated At", value: new Date(user.updatedAt).toLocaleString() },
    { label: "Updated By", value: getUserName(user.updatedBy) },
  ];

  if (user.deactivatedBy) {
    userDetails.push(
      {
        label: "Deactivated By",
        value: getUserName(user.deactivatedBy),
      },
      {
        label: "Deactivated At",
        value: user.deactivatedAt
          ? new Date(user.deactivatedAt).toLocaleString()
          : "N/A",
      },
    );
  }

  let permissionsContent: React.ReactNode;
  if (permissionsLoading) {
    permissionsContent = (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-5" />
      </div>
    );
  } else if (permissionsError) {
    permissionsContent = (
      <div className="text-sm text-muted-foreground text-center py-8 px-4">
        Unable to load permissions for this user.
      </div>
    );
  } else if (!effectivePermissions || effectivePermissions.length === 0) {
    permissionsContent = (
      <div className="text-sm text-muted-foreground text-center py-8 px-4">
        No effective permissions found.
      </div>
    );
  } else {
    permissionsContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permission</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {effectivePermissions.map((permission) => (
            <TableRow key={`${permission.id}-${permission.source}`}>
              <TableCell className="font-medium">{permission.name}</TableCell>
              <TableCell>{permission.resource}</TableCell>
              <TableCell>{permission.action}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {permission.source}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title="View User"
      description="User details and permissions"
      className="sm:max-w-4xl"
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      <div className="space-y-6 py-2">
        <div>
          <Label className="font-semibold">User Information</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {userDetails.map((field) => (
              <div key={field.label} className="grid gap-1">
                <Label className="text-muted-foreground text-xs">
                  {field.label}
                </Label>
                <div className="text-sm">{field.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="font-semibold">Effective Permissions</Label>
          <div className="mt-3 border rounded-lg overflow-hidden">
            {permissionsContent}
          </div>
        </div>
      </div>
    </BaseDialog>
  );
}
