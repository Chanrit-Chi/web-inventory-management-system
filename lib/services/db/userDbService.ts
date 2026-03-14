import { prisma } from "@/lib/prisma";
import { User, UserCreate, UserUpdate } from "@/schemas/type-export.schema";
import { auth } from "@/lib/auth";
import { getServerSession } from "@/lib/getServerSession";
import { Role } from "@prisma/client";
import { generatePassword } from "@/lib/password-generator";
import { auditPermissionChange } from "@/lib/services/permission-service";

// ─── Role Hierarchy Helpers ───────────────────────────────────────────────────

const PRIVILEGED_ROLES: Role[] = [Role.ADMIN, Role.SUPER_ADMIN];

function isPrivilegedRole(role: Role): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

async function validateRoleHierarchy(
  currentUserRole: Role | undefined,
  targetRole: Role,
  operation: string,
): Promise<void> {
  // Only SUPER_ADMIN can manage privileged roles
  if (isPrivilegedRole(targetRole) && currentUserRole !== Role.SUPER_ADMIN) {
    throw new Error(
      `Only SUPER_ADMIN can ${operation} users with ${targetRole} role`,
    );
  }
}

async function validateTargetUser(
  currentUserRole: Role | undefined,
  targetUserId: string,
  operation: string,
): Promise<void> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Only SUPER_ADMIN can manage privileged users
  if (
    isPrivilegedRole(targetUser.role) &&
    currentUserRole !== Role.SUPER_ADMIN
  ) {
    throw new Error(
      `Only SUPER_ADMIN can ${operation} users with ${targetUser.role} role`,
    );
  }
}

async function preventSelfRoleModification(
  currentUserId: string | undefined,
  targetUserId: string,
  newRole: Role | undefined,
): Promise<void> {
  if (newRole && currentUserId === targetUserId) {
    throw new Error("Cannot modify your own role");
  }
}

function preventSuperAdminSelfPermissionGroupModification(
  currentUserId: string | undefined,
  targetUserId: string,
  currentUserRole: Role | undefined,
  payload: UserUpdate,
): void {
  const isSelfUpdate = currentUserId === targetUserId;
  const isSuperAdmin = currentUserRole === Role.SUPER_ADMIN;
  const hasPermissionGroupUpdate = Object.hasOwn(payload, "permissionGroupId");

  if (isSelfUpdate && isSuperAdmin && hasPermissionGroupUpdate) {
    throw new Error(
      "Forbidden: SUPER_ADMIN cannot edit their own permission group",
    );
  }
}

async function enforceLastAdminRule(targetUserId: string): Promise<void> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, isActive: true },
  });

  if (!targetUser?.isActive) {
    return; // Not an active admin, no check needed
  }

  // If deactivating an admin, check if they're the last one
  if (isPrivilegedRole(targetUser.role)) {
    const activeAdminCount = await prisma.user.count({
      where: {
        role: { in: PRIVILEGED_ROLES },
        isActive: true,
      },
    });

    if (activeAdminCount <= 1) {
      throw new Error(
        "Cannot deactivate the last privileged user in the system",
      );
    }
  }
}

// ─── User Database Service ────────────────────────────────────────────────────

export const userDbService = {
  fetchUsers: async (): Promise<User[]> => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deactivatedBy: true,
        deactivatedAt: true,
        permissionGroupId: true,
        permissionGroup: {
          select: {
            id: true,
            name: true,
            priority: true,
          },
        },
        _count: {
          select: {
            permissionOverrides: true,
          },
        },
      },
    });

    return users as unknown as User[];
  },

  fetchUserById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deactivatedBy: true,
        deactivatedAt: true,
        permissionGroupId: true,
        permissionGroup: {
          select: {
            id: true,
            name: true,
            priority: true,
          },
        },
        _count: {
          select: {
            permissionOverrides: true,
          },
        },
      },
    });
  },

  createUser: async (data: UserCreate): Promise<User> => {
    const { password, ...userData } = data;
    const session = await getServerSession();
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role as Role | undefined;

    // Validate: Only SUPER_ADMIN can create privileged roles
    await validateRoleHierarchy(currentUserRole, userData.role, "create");

    // Generate password if not provided
    const userPassword = password || generatePassword(12);

    // Use better-auth to create user with hashed password
    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: userPassword,
        name: userData.name,
      },
    });

    if (!result?.user) {
      throw new Error("Failed to create user");
    }

    // Update user with additional fields like role and audit info
    const updatedUser = await prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: userData.role,
        image: userData.image,
        permissionGroupId: userData.permissionGroupId || null,
        createdBy: currentUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deactivatedBy: true,
        deactivatedAt: true,
      },
    });

    // Audit log for user creation
    await auditPermissionChange({
      action: "user_created",
      targetType: "user",
      targetId: result.user.id,
      targetName: userData.name,
      reason: `User created with role: ${userData.role}`,
      metadata: {
        role: userData.role,
        permissionGroupId: userData.permissionGroupId || null,
      },
      createdBy: currentUserId || "system",
    });

    return updatedUser;
  },

  updateUser: async (id: string, data: UserUpdate): Promise<User> => {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role as Role | undefined;

    // Validate: Only SUPER_ADMIN can update privileged users
    await validateTargetUser(currentUserRole, id, "update");

    // Validate: Cannot modify your own role
    await preventSelfRoleModification(currentUserId, id, data.role);

    // Validate: SUPER_ADMIN cannot modify their own permission group
    preventSuperAdminSelfPermissionGroupModification(
      currentUserId,
      id,
      currentUserRole,
      data,
    );

    // Validate: If changing role to privileged, must be SUPER_ADMIN
    if (data.role) {
      await validateRoleHierarchy(currentUserRole, data.role, "assign");
    }

    // Get current user data for comparison before update
    const currentUserData = await prisma.user.findUnique({
      where: { id },
      select: {
        name: true,
        role: true,
        permissionGroupId: true,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedBy: currentUserId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        permissionGroupId: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deactivatedBy: true,
        deactivatedAt: true,
        permissionGroup: {
          select: {
            id: true,
            name: true,
            priority: true,
          },
        },
      },
    });

    // Logging role or group changes
    if (currentUserData) {
      if (data.role && data.role !== currentUserData.role) {
        await auditPermissionChange({
          action: "role_changed",
          targetType: "user",
          targetId: id,
          targetName: updatedUser.name,
          reason: `Role changed from ${currentUserData.role} to ${data.role}`,
          metadata: {
            oldRole: currentUserData.role,
            newRole: data.role,
          },
          createdBy: currentUserId || "system",
        });
      }

      if (
        Object.hasOwn(data, "permissionGroupId") &&
        data.permissionGroupId !== currentUserData.permissionGroupId
      ) {
        await auditPermissionChange({
          action: data.permissionGroupId ? "group_assigned" : "group_removed",
          targetType: "user",
          targetId: id,
          targetName: updatedUser.name,
          reason: data.permissionGroupId
            ? "Assigned to a custom permission group"
            : "Removed from custom permission group",
          metadata: {
            oldGroupId: currentUserData.permissionGroupId,
            newGroupId: data.permissionGroupId,
          },
          createdBy: currentUserId || "system",
        });
      }
    }

    return updatedUser;
  },

  deleteUser: async (id: string): Promise<User> => {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role as Role | undefined;

    // Validate: Only SUPER_ADMIN can deactivate privileged users
    await validateTargetUser(currentUserRole, id, "deactivate");

    // Validate: Cannot deactivate the last privileged user
    await enforceLastAdminRule(id);

    // Soft delete - set isActive to false and record who deactivated
    const deactivatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        deactivatedBy: currentUserId,
        deactivatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deactivatedBy: true,
        deactivatedAt: true,
      },
    });

    // Audit log for deactivation
    await auditPermissionChange({
      action: "user_deactivated",
      targetType: "user",
      targetId: id,
      targetName: deactivatedUser.name,
      reason: "User account deactivated",
      createdBy: currentUserId || "system",
    });

    return deactivatedUser;
  },

  reactivateUser: async (id: string): Promise<User> => {
    const session = await getServerSession();
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role as Role | undefined;

    // Validate: Only SUPER_ADMIN can reactivate privileged users
    await validateTargetUser(currentUserRole, id, "reactivate");

    const reactivatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        updatedBy: currentUserId,
        deactivatedBy: null,
        deactivatedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        deactivatedBy: true,
        deactivatedAt: true,
      },
    });

    // Audit log for reactivation
    await auditPermissionChange({
      action: "user_reactivated",
      targetType: "user",
      targetId: id,
      targetName: reactivatedUser.name,
      reason: "User account reactivated",
      createdBy: currentUserId || "system",
    });

    return reactivatedUser;
  },
} as const;
