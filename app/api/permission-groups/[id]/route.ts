import { NextRequest, NextResponse } from "next/server";
import {
  getPermissionGroupById,
  updatePermissionGroup,
  deletePermissionGroup,
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

    const group = await getPermissionGroupById(id);

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Permission group not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error fetching permission group:", error);

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
            : "Failed to fetch permission group",
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

    const { name, description, priority, baseRole } = body;
    const currentUserRole = session.user.role as Role | undefined;

    const group = await updatePermissionGroup(
      id,
      {
        name,
        description,
        priority,
        baseRole,
      },
      currentUserRole,
    );

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error("Error updating permission group:", error);

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
    if (error instanceof Error && error.message.includes("Only SUPER_ADMIN")) {
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
            : "Failed to update permission group",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermissionDBForAPI("permission:admin");
    const { id } = await params;
    const currentUserRole = session.user.role as Role | undefined;

    await deletePermissionGroup(id, currentUserRole);

    return NextResponse.json({
      success: true,
      message: "Permission group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting permission group:", error);

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
        error.message.includes("Cannot delete default"))
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
            : "Failed to delete permission group",
      },
      { status: 500 },
    );
  }
}
