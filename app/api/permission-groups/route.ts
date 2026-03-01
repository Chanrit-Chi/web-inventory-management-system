import { NextRequest, NextResponse } from "next/server";
import {
  getAllPermissionGroups,
  createPermissionGroup,
} from "@/lib/services/permission-service";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { Role } from "@prisma/client";

function getAuthErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof Error)) return null;

  if (error.message.startsWith("Unauthorized")) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }

  if (error.message.startsWith("Forbidden:")) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 403 },
    );
  }

  return null;
}

function isGroupNameUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const meta = "meta" in error ? error.meta : null;

  return (
    error.code === "P2002" &&
    typeof meta === "object" &&
    meta !== null &&
    "target" in meta &&
    Array.isArray(meta.target) &&
    meta.target.includes("name")
  );
}

function getCreateGroupErrorResponse(error: unknown): NextResponse | null {
  const authErrorResponse = getAuthErrorResponse(error);
  if (authErrorResponse) return authErrorResponse;

  if (error instanceof Error && error.message.includes("cannot assign")) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 403 },
    );
  }

  if (isGroupNameUniqueConstraintError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: "A permission group with this name already exists",
      },
      { status: 400 },
    );
  }

  return null;
}

export async function GET() {
  try {
    await requirePermissionDBForAPI("permission:admin");

    const groups = await getAllPermissionGroups();

    return NextResponse.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching permission groups:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch permission groups",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePermissionDBForAPI("permission:admin");
    const body = await request.json();

    const { name, description, priority, baseRole, permissionIds } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 },
      );
    }

    const currentUserRole = session.user.role as Role | undefined;

    const group = await createPermissionGroup(
      {
        name,
        description,
        priority,
        baseRole,
        permissionIds,
      },
      session.user.id,
      currentUserRole,
    );

    return NextResponse.json(
      {
        success: true,
        data: group,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating permission group:", error);

    const knownErrorResponse = getCreateGroupErrorResponse(error);
    if (knownErrorResponse) return knownErrorResponse;

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create permission group",
      },
      { status: 500 },
    );
  }
}
