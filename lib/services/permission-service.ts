import { prisma } from "@/lib/prisma";
import { PermissionCategory, Prisma, Role } from "@prisma/client";
import { clearPermissionCache, getUserPermissions } from "@/lib/rbac-db";

// ─── Role Hierarchy Helpers ───────────────────────────────────────────────────

/**
 * Validate if current user can manage a permission group
 */
async function validateGroupManagement(
  groupId: string | null,
  currentUserRole: Role | undefined,
): Promise<void> {
  // Only SUPER_ADMIN can manage default permission groups
  if (groupId) {
    const group = await prisma.permissionGroup.findUnique({
      where: { id: groupId },
      select: { isDefault: true, baseRole: true, name: true },
    });

    if (group?.name === "SUPER_ADMIN") {
      throw new Error(
        "Forbidden: SUPER_ADMIN permission group cannot be modified",
      );
    }

    if (group?.isDefault && currentUserRole !== Role.SUPER_ADMIN) {
      throw new Error(
        `Only SUPER_ADMIN can manage default permission groups (${group.name})`,
      );
    }
  }
}

/**
 * Validate if user has all permissions they're trying to assign
 */
async function validatePermissionAssignment(
  permissionIds: string[],
  currentUserId: string,
  currentUserRole: Role | undefined,
): Promise<void> {
  // SUPER_ADMIN can assign any permissions
  if (currentUserRole === Role.SUPER_ADMIN) {
    return;
  }

  // Get current user's effective permissions
  const userPermissions = await getUserPermissions(currentUserId);
  const userPermissionSet = new Set(userPermissions);

  // Get the permissions being assigned
  const permissionsToAssign = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { name: true },
  });

  // Check if user has all the permissions they're trying to assign
  const missingPermissions = permissionsToAssign.filter(
    (p) => !userPermissionSet.has(p.name),
  );

  if (missingPermissions.length > 0) {
    throw new Error(
      `You cannot assign permissions you don't have: ${missingPermissions.map((p) => p.name).join(", ")}`,
    );
  }
}

// ─── Permission Service ───────────────────────────────────────────────────────

/**
 * Get all available permissions
 */
export async function getAllPermissions() {
  return await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { resource: "asc" }, { action: "asc" }],
  });
}

/**
 * Get permissions by category
 */
export async function getPermissionsByCategory(category: PermissionCategory) {
  return await prisma.permission.findMany({
    where: { category },
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
}

/**
 * Get permissions by resource
 */
export async function getPermissionsByResource(resource: string) {
  return await prisma.permission.findMany({
    where: { resource },
    orderBy: { action: "asc" },
  });
}

// ─── Permission Group Management ──────────────────────────────────────────────

/**
 * Get all permission groups with permissions and user count
 */
export async function getAllPermissionGroups() {
  const groups = await prisma.permissionGroup.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: { priority: "desc" },
  });

  const usersWithoutCustomGroupByRole = await prisma.user.groupBy({
    by: ["role"],
    where: {
      permissionGroupId: null,
    },
    _count: {
      _all: true,
    },
  });

  const roleFallbackCountMap = new Map<Role, number>(
    usersWithoutCustomGroupByRole.map((row) => [row.role, row._count._all]),
  );

  return groups.map((group) => {
    if (!group.isDefault || !group.baseRole) {
      return {
        ...group,
        effectiveUserCount: group._count.users,
      };
    }

    return {
      ...group,
      effectiveUserCount: roleFallbackCountMap.get(group.baseRole) ?? 0,
    };
  });
}

/**
 * Get a specific permission group by ID
 */
export async function getPermissionGroupById(groupId: string) {
  return await prisma.permissionGroup.findUnique({
    where: { id: groupId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

/**
 * Get permissions for a specific group
 */
export async function getGroupPermissions(groupId: string) {
  const groupPerms = await prisma.groupPermission.findMany({
    where: { groupId },
    include: {
      permission: true,
    },
  });

  return groupPerms.map((gp) => gp.permission);
}

/**
 * Create a new custom permission group
 */
export async function createPermissionGroup(
  data: {
    name: string;
    description?: string;
    priority?: number;
    baseRole?: Role | null;
    permissionIds?: string[];
  },
  createdBy: string,
  currentUserRole?: Role,
) {
  const { permissionIds, ...groupData } = data;

  // Validate permission assignment
  if (permissionIds && permissionIds.length > 0) {
    await validatePermissionAssignment(
      permissionIds,
      createdBy,
      currentUserRole,
    );
  }

  const group = await prisma.permissionGroup.create({
    data: {
      ...groupData,
      isDefault: false,
      baseRole: groupData.baseRole ?? null,
    },
  });

  // Add permissions if provided
  if (permissionIds && permissionIds.length > 0) {
    await updateGroupPermissions(group.id, permissionIds, createdBy);
  }

  return group;
}

/**
 * Update permission group details
 */
export async function updatePermissionGroup(
  groupId: string,
  data: {
    name?: string;
    description?: string;
    priority?: number;
    baseRole?: Role | null;
  },
  currentUserRole?: Role,
) {
  // Validate if user can manage this group
  await validateGroupManagement(groupId, currentUserRole);

  return await prisma.permissionGroup.update({
    where: { id: groupId },
    data,
  });
}

/**
 * Delete a custom permission group
 */
export async function deletePermissionGroup(
  groupId: string,
  currentUserRole?: Role,
) {
  // Check if it's a default group
  const group = await prisma.permissionGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw new Error("Permission group not found");
  }

  if (group.isDefault) {
    throw new Error("Cannot delete default permission groups");
  }

  // Validate if user can manage this group
  await validateGroupManagement(groupId, currentUserRole);

  return await prisma.permissionGroup.delete({
    where: { id: groupId },
  });
}

/**
 * Update permissions for a group (replaces all existing permissions)
 */
export async function updateGroupPermissions(
  groupId: string,
  permissionIds: string[],
  updatedBy: string,
  currentUserRole?: Role,
) {
  // Validate if user can manage this group
  await validateGroupManagement(groupId, currentUserRole);

  // Validate permission assignment
  if (permissionIds.length > 0) {
    await validatePermissionAssignment(
      permissionIds,
      updatedBy,
      currentUserRole,
    );
  }

  // Delete existing permissions
  await prisma.groupPermission.deleteMany({
    where: { groupId },
  });

  // Add new permissions (only if there are any)
  if (permissionIds.length > 0) {
    const groupPermissions = permissionIds.map((permissionId) => ({
      groupId,
      permissionId,
    }));

    await prisma.groupPermission.createMany({
      data: groupPermissions,
    });
  }

  // Get group details for audit
  const group = await prisma.permissionGroup.findUnique({
    where: { id: groupId },
  });

  // Clear cache for all users in this group
  const usersInGroup = await prisma.user.findMany({
    where: { permissionGroupId: groupId },
    select: { id: true },
  });

  for (const user of usersInGroup) {
    clearPermissionCache(user.id);
  }

  // Audit log
  await auditPermissionChange({
    action: "updated",
    targetType: "group",
    targetId: groupId,
    targetName: group?.name || groupId,
    reason: "Group permissions updated",
    metadata: {
      permissionCount: permissionIds.length,
    },
    createdBy: updatedBy,
  });

  return true;
}

// ─── User Permission Override Management ──────────────────────────────────────

/**
 * Get all permission overrides for a user
 */
export async function getUserOverrides(userId: string) {
  return await prisma.userPermissionOverride.findMany({
    where: { userId },
    include: {
      permission: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get effective permissions for a user
 */
export async function getUserEffectivePermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      permissionGroup: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      permissionOverrides: {
        where: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  // Start with base permissions
  const permissions = new Map<
    string,
    {
      id: string;
      name: string;
      source: string;
      [key: string]: unknown;
    }
  >();

  // Get base role permissions
  const roleGroup = await prisma.permissionGroup.findFirst({
    where: {
      baseRole: user.role,
      isDefault: true,
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (roleGroup) {
    for (const gp of roleGroup.permissions) {
      permissions.set(gp.permission.id, {
        ...gp.permission,
        source: "role",
        role: user.role,
      });
    }
  }

  // Override with custom group permissions if assigned
  if (user.permissionGroup) {
    permissions.clear(); // Custom group replaces role permissions
    for (const gp of user.permissionGroup.permissions) {
      permissions.set(gp.permission.id, {
        ...gp.permission,
        source: "group",
        groupName: user.permissionGroup.name,
      });
    }
  }

  // Apply user overrides
  for (const override of user.permissionOverrides) {
    if (override.granted) {
      permissions.set(override.permission.id, {
        ...override.permission,
        source: "override",
        granted: true,
        reason: override.reason,
        expiresAt: override.expiresAt,
      });
    } else {
      permissions.delete(override.permission.id);
    }
  }

  return Array.from(permissions.values());
}

/**
 * Grant a permission to a user (create override)
 */
export async function grantUserPermission(
  userId: string,
  permissionId: string,
  options: {
    reason?: string;
    expiresAt?: Date;
    createdBy: string;
    currentUserRole?: Role;
  },
) {
  const { reason, expiresAt, createdBy, currentUserRole } = options;

  await validatePermissionAssignment(
    [permissionId],
    createdBy,
    currentUserRole,
  );

  const override = await prisma.userPermissionOverride.upsert({
    where: {
      userId_permissionId: {
        userId,
        permissionId,
      },
    },
    update: {
      granted: true,
      reason,
      expiresAt,
      createdBy,
    },
    create: {
      userId,
      permissionId,
      granted: true,
      reason,
      expiresAt,
      createdBy,
    },
    include: {
      permission: true,
      user: true,
    },
  });

  // Clear user's permission cache
  clearPermissionCache(userId);

  // Audit log
  await auditPermissionChange({
    action: "granted",
    targetType: "user",
    targetId: userId,
    targetName: override.user.name,
    permissionId,
    permissionName: override.permission.name,
    reason,
    metadata: {
      expiresAt: expiresAt?.toISOString(),
    },
    createdBy,
  });

  return override;
}

/**
 * Grant multiple permissions to a user (atomic operation)
 */
export async function grantUserPermissionsBulk(
  userId: string,
  permissionIds: string[],
  options: {
    reason?: string;
    expiresAt?: Date;
    createdBy: string;
    currentUserRole?: Role;
  },
) {
  const { reason, expiresAt, createdBy, currentUserRole } = options;

  const uniquePermissionIds = Array.from(new Set(permissionIds));
  if (uniquePermissionIds.length === 0) {
    throw new Error("At least one permission is required");
  }

  await validatePermissionAssignment(
    uniquePermissionIds,
    createdBy,
    currentUserRole,
  );

  const [user, permissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.permission.findMany({
      where: { id: { in: uniquePermissionIds } },
      select: { id: true, name: true },
    }),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  if (permissions.length !== uniquePermissionIds.length) {
    throw new Error("One or more permissions were not found");
  }

  await prisma.$transaction(
    uniquePermissionIds.map((permissionId) =>
      prisma.userPermissionOverride.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId,
          },
        },
        update: {
          granted: true,
          reason,
          expiresAt,
          createdBy,
        },
        create: {
          userId,
          permissionId,
          granted: true,
          reason,
          expiresAt,
          createdBy,
        },
      }),
    ),
  );

  clearPermissionCache(userId);

  await auditPermissionChange({
    action: "granted_bulk",
    targetType: "user",
    targetId: userId,
    targetName: user.name,
    reason,
    metadata: {
      permissionIds: uniquePermissionIds,
      permissionNames: permissions.map((permission) => permission.name),
      permissionCount: uniquePermissionIds.length,
      expiresAt: expiresAt?.toISOString(),
    },
    createdBy,
  });

  return {
    userId,
    grantedCount: uniquePermissionIds.length,
  };
}

/**
 * Revoke a permission from a user (create override with granted=false)
 */
export async function revokeUserPermission(
  userId: string,
  permissionId: string,
  options: {
    reason?: string;
    createdBy: string;
  },
) {
  const { reason, createdBy } = options;

  const override = await prisma.userPermissionOverride.upsert({
    where: {
      userId_permissionId: {
        userId,
        permissionId,
      },
    },
    update: {
      granted: false,
      reason,
      expiresAt: null,
      createdBy,
    },
    create: {
      userId,
      permissionId,
      granted: false,
      reason,
      createdBy,
    },
    include: {
      permission: true,
      user: true,
    },
  });

  // Clear user's permission cache
  clearPermissionCache(userId);

  // Audit log
  await auditPermissionChange({
    action: "revoked",
    targetType: "user",
    targetId: userId,
    targetName: override.user.name,
    permissionId,
    permissionName: override.permission.name,
    reason,
    createdBy,
  });

  return override;
}

/**
 * Remove a permission override (revert to group/role permissions)
 */
export async function removeUserOverride(
  userId: string,
  permissionId: string,
  removedBy: string,
) {
  const override = await prisma.userPermissionOverride.findUnique({
    where: {
      userId_permissionId: {
        userId,
        permissionId,
      },
    },
    include: {
      permission: true,
      user: true,
    },
  });

  if (!override) {
    throw new Error("Override not found");
  }

  await prisma.userPermissionOverride.delete({
    where: {
      userId_permissionId: {
        userId,
        permissionId,
      },
    },
  });

  // Clear user's permission cache
  clearPermissionCache(userId);

  // Audit log
  await auditPermissionChange({
    action: "removed",
    targetType: "user",
    targetId: userId,
    targetName: override.user.name,
    permissionId,
    permissionName: override.permission.name,
    reason: "Override removed",
    createdBy: removedBy,
  });

  return true;
}

/**
 * Assign a user to a permission group
 */
export async function assignUserToGroup(
  userId: string,
  groupId: string | null,
  assignedBy: string,
) {
  if (userId === assignedBy) {
    const actor = await prisma.user.findUnique({
      where: { id: assignedBy },
      select: { role: true },
    });

    if (actor?.role === Role.SUPER_ADMIN) {
      throw new Error(
        "Forbidden: SUPER_ADMIN cannot edit their own permission group",
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { permissionGroupId: groupId },
    include: {
      permissionGroup: true,
    },
  });

  // Clear user's permission cache
  clearPermissionCache(userId);

  // Audit log
  await auditPermissionChange({
    action: groupId ? "assigned" : "unassigned",
    targetType: "user",
    targetId: userId,
    targetName: user.name,
    reason: groupId
      ? `Assigned to group: ${user.permissionGroup?.name}`
      : "Removed from custom group",
    metadata: {
      groupId,
      groupName: user.permissionGroup?.name,
    },
    createdBy: assignedBy,
  });

  return user;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

/**
 * Log a permission change
 */
export async function auditPermissionChange(data: {
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  permissionId?: string;
  permissionName?: string;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
  createdBy: string;
}) {
  return await prisma.permissionAuditLog.create({
    data: {
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      targetName: data.targetName,
      permissionId: data.permissionId || null,
      permissionName: data.permissionName || null,
      reason: data.reason || null,
      metadata: data.metadata || Prisma.JsonNull,
      createdBy: data.createdBy,
    },
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  targetType?: string;
  targetId?: string;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: {
    targetType?: string;
    targetId?: string;
    createdBy?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (filters.targetType) {
    where.targetType = filters.targetType;
  }

  if (filters.targetId) {
    where.targetId = filters.targetId;
  }

  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.permissionAuditLog.findMany({
      where,
      include: {
        permission: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.permissionAuditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Clean up expired permission overrides
 */
export async function cleanupExpiredOverrides() {
  const expired = await prisma.userPermissionOverride.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  // Clear cache for affected users
  clearPermissionCache();

  return expired.count;
}
