"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useUserPermissionOverrides,
  useUserEffectivePermissions,
  useCurrentUserPermissions,
  useUserPermissionMutations,
} from "@/hooks/useUserPermissionOverrides";
import { PermissionMatrix } from "./permission-matrix";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserPermissionOverrideDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly userId: string;
  readonly userName: string;
}

export function UserPermissionOverrideDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: Readonly<UserPermissionOverrideDialogProps>) {
  const [mode, setMode] = useState<"grant" | "revoke">("grant");
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [pendingRemovePermissionId, setPendingRemovePermissionId] = useState<
    string | null
  >(null);
  const [pendingRemovePermissionName, setPendingRemovePermissionName] =
    useState<string>("");
  const [selectedGrantPermissions, setSelectedGrantPermissions] = useState<
    string[]
  >([]);
  const [grantReason, setGrantReason] = useState("");
  const [grantExpiresAt, setGrantExpiresAt] = useState<string>("");

  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [reason, setReason] = useState("");

  const { data: permissions, isPending: loadingPermissions } = usePermissions();
  const { data: overrides, isPending: loadingOverrides } =
    useUserPermissionOverrides(userId);
  const { data: effectivePermissions, isPending: loadingEffectivePermissions } =
    useUserEffectivePermissions(userId);
  const {
    data: currentUserPermissions,
    isPending: loadingCurrentUserPermissions,
  } = useCurrentUserPermissions();
  const { grantPermissionsBulk, revokePermission, removeOverride } =
    useUserPermissionMutations();

  const effectivePermissionIdSet = useMemo(
    () =>
      new Set((effectivePermissions || []).map((permission) => permission.id)),
    [effectivePermissions],
  );

  const existingEffectivePermissionIds = useMemo(
    () => Array.from(effectivePermissionIdSet),
    [effectivePermissionIdSet],
  );

  const actorPermissionNameSet = useMemo(
    () =>
      new Set(
        (currentUserPermissions || []).map((permission) => permission.name),
      ),
    [currentUserPermissions],
  );

  const disabledGrantPermissionIds = useMemo(() => {
    if (!permissions) return [];

    return permissions
      .filter(
        (permission) =>
          effectivePermissionIdSet.has(permission.id) ||
          !actorPermissionNameSet.has(permission.name),
      )
      .map((permission) => permission.id);
  }, [permissions, effectivePermissionIdSet, actorPermissionNameSet]);

  const selectableGrantCount = useMemo(() => {
    if (!permissions) return 0;
    return permissions.length - disabledGrantPermissionIds.length;
  }, [permissions, disabledGrantPermissionIds]);

  const canGrantSelected =
    selectedGrantPermissions.length > 0 &&
    grantReason.trim().length > 0 &&
    !grantPermissionsBulk.isPending;

  const matrixSelectedPermissions = useMemo(
    () =>
      Array.from(
        new Set([
          ...existingEffectivePermissionIds,
          ...selectedGrantPermissions,
        ]),
      ),
    [existingEffectivePermissionIds, selectedGrantPermissions],
  );

  const handleGrantBulk = async () => {
    if (!canGrantSelected) return;

    try {
      await grantPermissionsBulk.mutateAsync({
        userId,
        permissionIds: selectedGrantPermissions,
        reason: grantReason.trim(),
        expiresAt: grantExpiresAt ? new Date(grantExpiresAt) : undefined,
      });

      setSelectedGrantPermissions([]);
      setGrantReason("");
      setGrantExpiresAt("");
      setGrantDialogOpen(false);
    } catch {
      // Error handling (mutations already show toast)
    }
  };

  const handleRevoke = async () => {
    if (!selectedPermission || !reason.trim()) return;

    try {
      await revokePermission.mutateAsync({
        userId,
        permissionId: selectedPermission,
        reason: reason.trim(),
      });

      setSelectedPermission("");
      setReason("");
      onOpenChange(false);
    } catch {
      // Error handling
    }
  };

  const handleRemoveOverride = async () => {
    if (!pendingRemovePermissionId) return;

    try {
      await removeOverride.mutateAsync({
        userId,
        permissionId: pendingRemovePermissionId,
      });
      setRemoveDialogOpen(false);
      setPendingRemovePermissionId(null);
      setPendingRemovePermissionName("");
    } catch {
      // Error handling
    }
  };

  const availablePermissions = permissions?.filter((perm) => {
    const hasOverride = overrides?.some((o) => o.permissionId === perm.id);
    return hasOverride;
  });

  let currentOverridesContent: React.ReactNode;
  if (loadingOverrides) {
    currentOverridesContent = <Skeleton className="h-20 w-full" />;
  } else if (!overrides || overrides.length === 0) {
    currentOverridesContent = (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No permission overrides for this user
      </p>
    );
  } else {
    currentOverridesContent = (
      <div className="space-y-2">
        {overrides.map((override) => {
          const permission = permissions?.find(
            (p) => p.id === override.permissionId,
          );
          const isExpired = override.expiresAt
            ? new Date(override.expiresAt) < new Date()
            : false;

          return (
            <div
              key={override.id}
              className="flex items-start gap-2 p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={override.granted ? "default" : "destructive"}>
                    {override.granted ? "Granted" : "Revoked"}
                  </Badge>
                  <span className="font-medium">
                    {permission?.name || "Unknown Permission"}
                  </span>
                  {isExpired && (
                    <Badge variant="outline" className="text-xs">
                      Expired
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {override.reason}
                </p>
                {override.expiresAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires: {new Date(override.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPendingRemovePermissionId(override.permissionId);
                  setPendingRemovePermissionName(
                    permission?.name || "Unknown Permission",
                  );
                  setRemoveDialogOpen(true);
                }}
                disabled={removeOverride.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permission Overrides</DialogTitle>
          <DialogDescription>
            Grant or revoke specific permissions for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Overrides */}
          <div>
            <Label className="text-base">Current Overrides</Label>
            <div className="mt-2 space-y-2">{currentOverridesContent}</div>
          </div>

          <Separator />

          {/* Add New Override */}
          <div className="space-y-4">
            <Label className="text-base">Add Override</Label>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mode">Action</Label>
                <Select
                  value={mode}
                  onValueChange={(value) => {
                    setMode(value as "grant" | "revoke");
                    setSelectedPermission("");
                  }}
                >
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grant">Grant Permission</SelectItem>
                    <SelectItem value="revoke">Revoke Permission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "grant" ? (
                <div className="grid gap-2">
                  <Label>Grant Permissions</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGrantDialogOpen(true)}
                    disabled={
                      loadingPermissions ||
                      loadingEffectivePermissions ||
                      loadingCurrentUserPermissions
                    }
                    className="justify-between"
                  >
                    <span>Open Multi-Grant Dialog</span>
                    {selectedGrantPermissions.length > 0 && (
                      <Badge variant="secondary">
                        {selectedGrantPermissions.length} selected
                      </Badge>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Select multiple permissions. Already effective permissions
                    and permissions you don&apos;t have are disabled.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectableGrantCount} permission
                    {selectableGrantCount === 1 ? "" : "s"} available to grant
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="permission">Permission</Label>
                    {loadingPermissions ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={selectedPermission}
                        onValueChange={setSelectedPermission}
                      >
                        <SelectTrigger id="permission">
                          <SelectValue placeholder="Select a permission" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePermissions?.map((perm) => (
                            <SelectItem key={perm.id} value={perm.id}>
                              {perm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Textarea
                      id="reason"
                      placeholder="Why is this override necessary?"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {mode === "revoke" && (
            <Button
              onClick={handleRevoke}
              disabled={
                !selectedPermission ||
                !reason.trim() ||
                revokePermission.isPending
              }
            >
              Revoke Permission
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grant Multiple Permissions</DialogTitle>
            <DialogDescription>
              Select permissions to grant for {userName}
            </DialogDescription>
          </DialogHeader>

          {loadingPermissions ||
          loadingEffectivePermissions ||
          loadingCurrentUserPermissions ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              <PermissionMatrix
                selectedPermissions={matrixSelectedPermissions}
                onChange={(permissionIds) => {
                  setSelectedGrantPermissions(
                    permissionIds.filter(
                      (permissionId) =>
                        !effectivePermissionIdSet.has(permissionId),
                    ),
                  );
                }}
                disabledPermissionIds={disabledGrantPermissionIds}
              />

              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground mb-2">Legend</div>
                <div className="space-y-1">
                  <p>• Checked + disabled = already granted effectively</p>
                  <p>
                    • Unchecked + disabled = you cannot grant this permission
                  </p>
                  <p>• Unchecked = available to grant</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="grantReason">Reason *</Label>
                <Textarea
                  id="grantReason"
                  placeholder="Why are these permissions necessary?"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="grantExpiresAt">
                  Expiration Date (Optional)
                </Label>
                <Input
                  id="grantExpiresAt"
                  type="date"
                  value={grantExpiresAt}
                  onChange={(e) => setGrantExpiresAt(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for permanent override
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGrantDialogOpen(false);
                setSelectedGrantPermissions([]);
                setGrantReason("");
                setGrantExpiresAt("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleGrantBulk} disabled={!canGrantSelected}>
              Grant {selectedGrantPermissions.length} Permission
              {selectedGrantPermissions.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={removeDialogOpen}
        onOpenChange={(nextOpen) => {
          setRemoveDialogOpen(nextOpen);
          if (!nextOpen) {
            setPendingRemovePermissionId(null);
            setPendingRemovePermissionName("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Override</DialogTitle>
            <DialogDescription>
              Remove override for &quot;{pendingRemovePermissionName}&quot; and
              revert this permission to role/group behavior?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveDialogOpen(false);
                setPendingRemovePermissionId(null);
                setPendingRemovePermissionName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveOverride}
              disabled={removeOverride.isPending || !pendingRemovePermissionId}
            >
              Remove Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
