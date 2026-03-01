"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissionAudit } from "@/hooks/usePermissionAudit";
import {
  AlertCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  GRANT_PERMISSION: "Grant",
  REVOKE_PERMISSION: "Revoke",
  REMOVE_OVERRIDE: "Remove Override",
  CREATE_GROUP: "Create Group",
  UPDATE_GROUP: "Update Group",
  DELETE_GROUP: "Delete Group",
  ASSIGN_TO_GROUP: "Assign to Group",
  UPDATE_GROUP_PERMISSIONS: "Update Permissions",
};

const ACTION_COLORS: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  GRANT_PERMISSION: "default",
  REVOKE_PERMISSION: "destructive",
  REMOVE_OVERRIDE: "secondary",
  CREATE_GROUP: "default",
  UPDATE_GROUP: "default",
  DELETE_GROUP: "destructive",
  ASSIGN_TO_GROUP: "default",
  UPDATE_GROUP_PERMISSIONS: "default",
};

export function PermissionAuditTable() {
  const [targetType, setTargetType] = useState<string>("");
  const [createdBy, setCreatedBy] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isPending, error } = usePermissionAudit({
    targetType: targetType || undefined,
    createdBy: createdBy || undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const handleClearFilters = () => {
    setTargetType("");
    setCreatedBy("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = targetType || createdBy || startDate || endDate;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="targetType">Target Type</Label>
          <Select
            value={targetType || undefined}
            onValueChange={(value) => setTargetType(value || "")}
          >
            <SelectTrigger id="targetType">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="createdBy">Created By (Email)</Label>
          <div className="relative">
            <Input
              id="createdBy"
              placeholder="user@example.com"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              className="pr-8"
            />
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}

      {/* Table */}
      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load audit logs. Please try again.
          </AlertDescription>
        </Alert>
      ) : !data || data.logs.length === 0 ? (
        <Alert>
          <AlertDescription>
            {hasFilters
              ? "No audit logs found matching your filters."
              : "No audit logs available yet."}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.logs.map((log) => {
                  const metadata = log.metadata as Record<string, unknown>;

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ACTION_COLORS[log.action] || "default"}>
                          {ACTION_LABELS[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {log.targetType}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {log.targetName || log.targetId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.createdByUser?.name ||
                          log.createdByUser?.email ||
                          log.createdBy ||
                          "System"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          {log.permissionName && (
                            <p className="text-muted-foreground">
                              Permission:{" "}
                              <span className="font-medium text-foreground">
                                {log.permissionName}
                              </span>
                            </p>
                          )}
                          {log.reason && (
                            <p className="text-muted-foreground italic">
                              {log.reason}
                            </p>
                          )}
                          {metadata && Object.keys(metadata).length > 0 && (
                            <div className="text-muted-foreground">
                              {typeof metadata.permissionCount === "number" && (
                                <p>Permissions: {metadata.permissionCount}</p>
                              )}
                              {typeof metadata.groupName === "string" &&
                                metadata.groupName && (
                                  <p>
                                    Group:{" "}
                                    <span className="font-medium text-foreground">
                                      {metadata.groupName}
                                    </span>
                                  </p>
                                )}
                              {typeof metadata.expiresAt === "string" &&
                                metadata.expiresAt && (
                                  <p>
                                    Expires:{" "}
                                    {new Date(
                                      metadata.expiresAt,
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, data.total)} of {data.total} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {Math.ceil(data.total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(data.total / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
