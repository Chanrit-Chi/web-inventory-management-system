import { NextRequest, NextResponse } from "next/server";
import {
  getGroupPermissions,
  updateGroupPermissions,
} from "@/lib/services/permission-service";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { Role } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("permission:admin");
    const { id } = await params;

    const permissions = await getGroupPermissions(id);

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error("Error fetching group permissions:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch group permissions",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermissionDBForAPI("permission:admin");
    const { id } = await params;
    const body = await request.json();

    const { permissionIds } = body;

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { success: false, error: "permissionIds must be an array" },
        { status: 400 },
      );
    }

    const currentUserRole = session.user.role as Role | undefined;

    await updateGroupPermissions(
      id,
      permissionIds,
      session.user.id,
      currentUserRole,
    );

    return NextResponse.json({
      success: true,
      message: "Group permissions updated successfully",
    });
  } catch (error) {
    console.error("Error updating group permissions:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 },
      );
    }

    // Handle validation errors
    if (
      error instanceof Error &&
      (error.message.includes("Only SUPER_ADMIN") ||
        error.message.includes("cannot assign"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update group permissions",
      },
      { status: 500 },
    );
  }
}
