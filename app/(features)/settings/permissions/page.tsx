"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionGroupEditor } from "@/components/admin/permission-group-editor";
import { PermissionAuditTable } from "@/components/admin/permission-audit-table";
import {
  usePermissionGroups,
  usePermissionGroupMutations,
} from "@/hooks/usePermissionGroups";
import ClientPermissionGuard from "@/components/ClientPermissionGuard";
import { Plus, Pencil, Trash2, Users, Shield, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "@/lib/auth-client";
import { Role } from "@prisma/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PermissionsPage() {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const { data: groups, isPending: loadingGroups } = usePermissionGroups();
  const { deleteGroup } = usePermissionGroupMutations();
  const { data: session } = useSession();
  const currentUserRole = (session?.user as any)?.role as Role | undefined;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;

  // Filter groups based on role hierarchy
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    if (isSuperAdmin) return groups;

    // ADMIN users cannot see/manage SUPER_ADMIN groups or default SUPER_ADMIN group
    return groups.filter(
      (group) =>
        group.baseRole !== Role.SUPER_ADMIN && group.name !== "SUPER_ADMIN",
    );
  }, [groups, isSuperAdmin]);

  // Check if user can manage a specific group
  const canManageGroup = (group: {
    isDefault: boolean;
    baseRole: string | null;
    name: string;
  }) => {
    if (group.baseRole === Role.SUPER_ADMIN || group.name === "SUPER_ADMIN") {
      return false;
    }

    if (isSuperAdmin) return true;
    if (group.isDefault) return false; // ADMIN cannot manage default groups
    return true;
  };

  const getGroupManageDisabledReason = (group: {
    isDefault: boolean;
    baseRole: string | null;
    name: string;
  }) => {
    if (group.baseRole === Role.SUPER_ADMIN || group.name === "SUPER_ADMIN") {
      return "SUPER_ADMIN permission group cannot be modified";
    }

    if (group.isDefault) {
      return "Only SUPER_ADMIN can manage default groups";
    }

    return "No permission";
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteGroup.mutateAsync(groupToDelete);
      setGroupToDelete(null);
    } catch {
      // Error handling
    }
  };

  let permissionGroupsContent: React.ReactNode;
  if (loadingGroups) {
    permissionGroupsContent = (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  } else if (!filteredGroups || filteredGroups.length === 0) {
    permissionGroupsContent = (
      <Alert>
        <AlertDescription>
          No permission groups found. Create your first custom group to get
          started.
        </AlertDescription>
      </Alert>
    );
  } else {
    permissionGroupsContent = (
      <div className="grid gap-4 md:grid-cols-2">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    {group.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    <Badge variant="outline">Priority: {group.priority}</Badge>
                  </div>
                  {group.description && (
                    <CardDescription className="mt-2">
                      {group.description}
                    </CardDescription>
                  )}
                  {group.baseRole && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Base Role: {group.baseRole}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{group.permissions.length} permissions</span>
                  <span>
                    {group.effectiveUserCount ?? group._count.users} users
                  </span>
                </div>
                <div className="flex gap-2">
                  {canManageGroup(group) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/settings/permissions/groups/${group.id}`)
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="outline" size="sm" disabled>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {getGroupManageDisabledReason(group)}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {!group.isDefault && canManageGroup(group) && (
                    <Dialog
                      open={groupToDelete === group.id}
                      onOpenChange={(open) =>
                        setGroupToDelete(open ? group.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Permission Group</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete &quot;{group.name}
                            &quot;? Users assigned to this group will lose these
                            permissions.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setGroupToDelete(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteGroup}
                            disabled={deleteGroup.isPending}
                          >
                            Delete Group
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <ClientPermissionGuard permission="permission:admin">
      <TooltipProvider>
        <div className="container mx-auto py-6 px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Permission Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage user permissions, custom groups, and access control
            </p>
          </div>

          <Tabs defaultValue="groups" className="space-y-6">
            <div className="overflow-x-auto pb-1 scrollbar-hide">
              <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 flex-nowrap gap-1 bg-muted/30 backdrop-blur-lg border-border/50">
                <TabsTrigger
                  value="groups"
                  className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-500/20 dark:data-[state=active]:text-emerald-400"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Permission Groups
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-500/20 dark:data-[state=active]:text-blue-400"
                >
                  <Users className="mr-2 h-4 w-4" />
                  User Assignments
                </TabsTrigger>
                <TabsTrigger
                  value="audit"
                  className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-500/20 dark:data-[state=active]:text-amber-400"
                >
                  <History className="mr-2 h-4 w-4" />
                  Audit Log
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="groups" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Permission Groups</CardTitle>
                      <CardDescription>
                        Create custom permission groups to organize user access
                        levels
                      </CardDescription>
                    </div>
                    <Dialog
                      open={showCreateDialog}
                      onOpenChange={setShowCreateDialog}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Group
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <PermissionGroupEditor
                          onSaved={() => setShowCreateDialog(false)}
                          onCancel={() => setShowCreateDialog(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>{permissionGroupsContent}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Permission Assignments</CardTitle>
                  <CardDescription>
                    View and manage user permissions from the Employee page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        Manage individual user permissions and group assignments
                        from the Employee management page.
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/employee")}
                      >
                        Go to Employee Page
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Permission Audit Log</CardTitle>
                  <CardDescription>
                    Track all permission changes across your system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PermissionAuditTable />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </ClientPermissionGuard>
  );
}
