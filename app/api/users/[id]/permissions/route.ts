import { NextRequest, NextResponse } from "next/server";
import {
  getUserOverrides,
  getUserEffectivePermissions,
  grantUserPermission,
  grantUserPermissionsBulk,
  revokeUserPermission,
  removeUserOverride,
  assignUserToGroup,
} from "@/lib/services/permission-service";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getServerSession } from "@/lib/getServerSession";

const PRIVILEGED_ROLES = new Set<Role>([Role.ADMIN, Role.SUPER_ADMIN]);

function isPrivilegedRole(role: Role): boolean {
  return PRIVILEGED_ROLES.has(role);
}

async function validateTargetUserForPermissionManagement(
  targetUserId: string,
  currentUserRole: Role | undefined,
): Promise<void> {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Only SUPER_ADMIN can manage permissions for privileged users
  if (
    isPrivilegedRole(targetUser.role) &&
    currentUserRole !== Role.SUPER_ADMIN
  ) {
    throw new Error(
      `Only SUPER_ADMIN can manage permissions for users with ${targetUser.role} role`,
    );
  }
}

type PermissionActionBody = {
  action?: string;
  permissionId?: string;
  permissionIds?: string[];
  reason?: string;
  expiresAt?: string;
  groupId?: string | null;
};

async function executePermissionAction(options: {
  userId: string;
  body: PermissionActionBody;
  sessionUserId: string;
  currentUserRole: Role | undefined;
}) {
  const { userId, body, sessionUserId, currentUserRole } = options;
  const { action, permissionId, permissionIds, reason, expiresAt, groupId } =
    body;

  if (!action) {
    throw new Error("Action is required");
  }

  if (action === "grant") {
    if (!permissionId) {
      throw new Error("permissionId is required for grant action");
    }

    return grantUserPermission(userId, permissionId, {
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: sessionUserId,
      currentUserRole,
    });
  }

  if (action === "grant_bulk") {
    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      throw new Error("permissionIds is required for grant_bulk action");
    }

    return grantUserPermissionsBulk(userId, permissionIds, {
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: sessionUserId,
      currentUserRole,
    });
  }

  if (action === "revoke") {
    if (!permissionId) {
      throw new Error("permissionId is required for revoke action");
    }

    return revokeUserPermission(userId, permissionId, {
      reason,
      createdBy: sessionUserId,
    });
  }

  if (action === "assign_group") {
    return assignUserToGroup(userId, groupId ?? null, sessionUserId);
  }

  throw new Error("Invalid action");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overrides";

    const session = await getServerSession();
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role as Role | undefined;

    // Allow users to fetch their own effective permissions without permission check
    // This is needed for the permission system to work (avoid chicken-and-egg problem)
    const isFetchingOwnPermissions =
      userId === currentUserId && type === "effective";

    if (!isFetchingOwnPermissions) {
      // For viewing other users' permissions, require permission:admin
      await requirePermissionDBForAPI("permission:admin");

      // Validate role hierarchy - can't view permissions of privileged users
      await validateTargetUserForPermissionManagement(userId, currentUserRole);
    }

    const data =
      type === "effective"
        ? await getUserEffectivePermissions(userId)
        : await getUserOverrides(userId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch user permissions";
    let statusCode = 500;
    if (errorMessage.startsWith("Unauthorized")) {
      statusCode = 401;
    } else if (
      errorMessage.startsWith("Forbidden:") ||
      errorMessage.includes("Only SUPER_ADMIN")
    ) {
      statusCode = 403;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermissionDBForAPI("permission:admin");
    const { id: userId } = await params;
    const body = (await request.json()) as PermissionActionBody;

    // Validate role hierarchy
    const currentUserRole = session.user.role as Role | undefined;
    await validateTargetUserForPermissionManagement(userId, currentUserRole);

    const result = await executePermissionAction({
      userId,
      body,
      sessionUserId: session.user.id,
      currentUserRole,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error managing user permission:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to manage user permission";
    let statusCode = 500;
    if (errorMessage.startsWith("Unauthorized")) {
      statusCode = 401;
    } else if (
      errorMessage.startsWith("Forbidden:") ||
      errorMessage.includes("Only SUPER_ADMIN")
    ) {
      statusCode = 403;
    } else if (
      errorMessage.includes("required") ||
      errorMessage === "Invalid action"
    ) {
      statusCode = 400;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermissionDBForAPI("permission:admin");
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return NextResponse.json(
        { success: false, error: "permissionId is required" },
        { status: 400 },
      );
    }

    // Validate role hierarchy
    const currentUserRole = session.user.role as Role | undefined;
    await validateTargetUserForPermissionManagement(userId, currentUserRole);

    await removeUserOverride(userId, permissionId, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Permission override removed successfully",
    });
  } catch (error) {
    console.error("Error removing user permission override:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to remove permission override";
    let statusCode = 500;
    if (errorMessage.startsWith("Unauthorized")) {
      statusCode = 401;
    } else if (
      errorMessage.startsWith("Forbidden:") ||
      errorMessage.includes("Only SUPER_ADMIN")
    ) {
      statusCode = 403;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode },
    );
  }
}
