"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  SquarePen,
  RotateCcw,
  Ban,
  KeyRound,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@/schemas/type-export.schema";
import { useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import { useSession } from "@/lib/auth-client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ViewUserDialog,
  UpdateUserDialog,
  DeactivateUserDialog,
  ReactivateUserDialog,
  ResetPasswordDialog,
} from "./user-dialogs";
import { Badge } from "@/components/ui/badge";
import { UserPermissionOverrideDialog } from "@/components/admin/user-permission-override-dialog";
import { Role } from "@prisma/client";

function ActionsCell({ user }: { readonly user: User }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const { can } = usePermission();
  const { data: session } = useSession();
  const isCurrentUser = session?.user?.id === user.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;

  // Check if user can edit this target user
  const canEditTargetUser =
    can("user:update") &&
    !isCurrentUser &&
    (isSuperAdmin ||
      (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN));
  const canDeleteTargetUser =
    can("user:delete") &&
    !isCurrentUser &&
    (isSuperAdmin ||
      (user.role !== Role.SUPER_ADMIN && user.role !== Role.ADMIN));
  const canManagePermissionTarget = can("permission:admin") && !isCurrentUser;

  return (
    <>
      <div className="flex justify-center items-center">
        <Eye
          className="size-5 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setViewOpen(true)}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex ml-4">
              <SquarePen
                className={`size-5 transition-colors ${
                  canEditTargetUser
                    ? "cursor-pointer hover:text-green-600"
                    : "opacity-40 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  canEditTargetUser ? () => setUpdateOpen(true) : undefined
                }
              />
            </span>
          </TooltipTrigger>
          {!canEditTargetUser && (
            <TooltipContent>
              {isCurrentUser
                ? "Cannot edit yourself here"
                : !can("user:update")
                  ? "No permission"
                  : "Cannot edit privileged users"}
            </TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex ml-4">
              <KeyRound
                className={`size-5 transition-colors ${
                  canEditTargetUser && user.isActive
                    ? "cursor-pointer hover:text-orange-600"
                    : "opacity-40 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  canEditTargetUser && user.isActive
                    ? () => setResetPasswordOpen(true)
                    : undefined
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {user.isActive
              ? canEditTargetUser
                ? "Reset Password"
                : isCurrentUser
                  ? "Cannot reset your own password here"
                  : !can("user:update")
                    ? "No permission"
                    : "Cannot reset password for privileged users"
              : "User is deactivated"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex ml-4">
              <Shield
                className={`size-5 transition-colors ${
                  canManagePermissionTarget
                    ? "cursor-pointer hover:text-purple-600"
                    : "opacity-40 cursor-not-allowed pointer-events-none"
                }`}
                onClick={
                  canManagePermissionTarget
                    ? () => setPermissionsOpen(true)
                    : undefined
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {isCurrentUser
              ? "Cannot manage your own overrides here"
              : can("permission:admin")
                ? "Manage Permissions"
                : "No permission"}
          </TooltipContent>
        </Tooltip>
        {user.isActive ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex ml-4">
                <Ban
                  className={`size-5 transition-colors ${
                    canDeleteTargetUser && !isCurrentUser
                      ? "text-red-600 cursor-pointer hover:text-red-800"
                      : "text-red-300 cursor-not-allowed pointer-events-none"
                  }`}
                  onClick={
                    canDeleteTargetUser && !isCurrentUser
                      ? () => setDeactivateOpen(true)
                      : undefined
                  }
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {isCurrentUser
                ? "Cannot deactivate yourself"
                : canDeleteTargetUser
                  ? "Deactivate"
                  : !can("user:delete")
                    ? "No permission"
                    : "Cannot deactivate privileged users"}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex ml-4">
                <RotateCcw
                  className={`size-5 transition-colors ${
                    canEditTargetUser
                      ? "text-green-600 cursor-pointer hover:text-green-800"
                      : "text-green-300 cursor-not-allowed pointer-events-none"
                  }`}
                  onClick={
                    canEditTargetUser
                      ? () => setReactivateOpen(true)
                      : undefined
                  }
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {canEditTargetUser
                ? "Reactivate"
                : !can("user:update")
                  ? "No permission"
                  : "Cannot reactivate privileged users"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <ViewUserDialog user={user} open={viewOpen} onOpenChange={setViewOpen} />
      <UpdateUserDialog
        user={user}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />
      <ResetPasswordDialog
        user={user}
        open={resetPasswordOpen}
        onOpenChange={setResetPasswordOpen}
      />
      <DeactivateUserDialog
        user={user}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      />
      <ReactivateUserDialog
        user={user}
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
      />
      <UserPermissionOverrideDialog
        userId={user.id}
        userName={user.name}
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
      />
    </>
  );
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "index",
    header: ({ column }) => {
      return (
        <Button
          size={undefined}
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "desc")}
        >
          No
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="px-4">{row.index + 1}</div>;
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="px-3">{row.original.name}</div>;
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      return <div>{row.original.email}</div>;
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.original.role;
      let variant: "destructive" | "default" | "secondary" = "secondary";
      let displayText: string = role;

      if (role === "SUPER_ADMIN") {
        variant = "destructive";
        displayText = "SUPER ADMIN";
      } else if (role === "ADMIN") {
        variant = "destructive";
      } else if (role === "MANAGER") {
        variant = "default";
      }
      return <Badge variant={variant}>{displayText}</Badge>;
    },
  },
  {
    accessorKey: "permissionGroup",
    header: "Permission Group",
    cell: ({ row }) => {
      const user = row.original;
      const overrideCount = user._count?.permissionOverrides || 0;

      return (
        <div className="flex flex-col gap-1">
          {user.permissionGroup ? (
            <Badge variant="outline">{user.permissionGroup.name}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              Default ({user.role})
            </span>
          )}
          {overrideCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {overrideCount} override{overrideCount === 1 ? "" : "s"}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "emailVerified",
    header: "Verified",
    cell: ({ row }) => {
      return (
        <Badge variant={row.original.emailVerified ? "default" : "secondary"}>
          {row.original.emailVerified ? "Yes" : "No"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      return (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id);
      return String(rowValue) === value;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          className="cursor-pointer"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell user={row.original} />,
  },
];
