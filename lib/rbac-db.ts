import { prisma } from "./prisma";
import { Role } from "@prisma/client";



interface CacheEntry {
  permissions: Set<string>;
  timestamp: number;
}

const permissionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(userId: string): string {
  return `user:${userId}`;
}

function getCachedPermissions(userId: string): Set<string> | null {
  const cached = permissionCache.get(getCacheKey(userId));
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }
  return null;
}

function setCachedPermissions(userId: string, permissions: Set<string>): void {
  permissionCache.set(getCacheKey(userId), {
    permissions,
    timestamp: Date.now(),
  });
}

export function clearPermissionCache(userId?: string): void {
  if (userId) {
    permissionCache.delete(getCacheKey(userId));
  } else {
    permissionCache.clear();
  }
}



async function fetchUserWithPermissions(userId: string) {
  return await prisma.user.findUnique({
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
}

async function getBasePermissions(user: {
  role: string;
  permissionGroup?: {
    permissions: Array<{ permission: { name: string } }>;
  } | null;
}): Promise<Set<string>> {
  const basePermissions = new Set<string>();

  // If user has a custom permission group, use that
  if (user.permissionGroup) {
    for (const gp of user.permissionGroup.permissions) {
      basePermissions.add(gp.permission.name);
    }
    return basePermissions;
  }

  // Otherwise, use base role permissions
  const roleGroup = await prisma.permissionGroup.findFirst({
    where: {
      baseRole: user.role as Role,
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
      basePermissions.add(gp.permission.name);
    }
  }

  return basePermissions;
}

function applyPermissionOverrides(
  basePermissions: Set<string>,
  overrides: Array<{ granted: boolean; permission: { name: string } }>,
): Set<string> {
  for (const override of overrides) {
    if (override.granted) {
      basePermissions.add(override.permission.name);
    } else {
      basePermissions.delete(override.permission.name);
    }
  }
  return basePermissions;
}

/**
 * Check if a user has a specific permission (database-driven)
 *
 * Permission resolution hierarchy:
 * 1. User-specific overrides (granted=true adds, granted=false removes)
 * 2. Custom permission group (if assigned)
 * 3. Base role permission group
 * 4. Deny by default
 */
export async function hasPermissionDB(
  userId: string,
  permissionName: string,
): Promise<boolean> {
  try {
    // Check cache first
    const cached = getCachedPermissions(userId);
    if (cached) {
      return cached.has(permissionName);
    }

    // Fetch user with all permission-related data
    const user = await fetchUserWithPermissions(userId);

    if (!user) {
      return false;
    }

    // Build base permissions set (from role or custom group)
    const basePermissions = await getBasePermissions(user);

    // Apply user-specific overrides
    const finalPermissions = applyPermissionOverrides(
      basePermissions,
      user.permissionOverrides,
    );

    // Cache the result
    setCachedPermissions(userId, finalPermissions);

    return finalPermissions.has(permissionName);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}


export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    // Check cache first
    const cached = getCachedPermissions(userId);
    if (cached) {
      return Array.from(cached);
    }

    // Force a permission check to populate cache
    await hasPermissionDB(userId, "__init__");

    const permissions = getCachedPermissions(userId);
    return permissions ? Array.from(permissions) : [];
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}


export async function hasAnyPermissionDB(
  userId: string,
  permissions: string[],
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermissionDB(userId, permission)) {
      return true;
    }
  }
  return false;
}


export async function hasAllPermissionsDB(
  userId: string,
  permissions: string[],
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermissionDB(userId, permission))) {
      return false;
    }
  }
  return true;
}


export async function getPermissionDetails(permissionName: string) {
  return await prisma.permission.findUnique({
    where: { name: permissionName },
  });
}


export async function getAllPermissions() {
  return await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { resource: "asc" }, { action: "asc" }],
  });
}


export async function getAllPermissionGroups() {
  return await prisma.permissionGroup.findMany({
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
}
