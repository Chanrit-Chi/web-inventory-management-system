import { NextRequest, NextResponse } from "next/server";
import {
  getAllPermissions,
  getPermissionsByCategory,
} from "@/lib/services/permission-service";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { PermissionCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Require permission:admin to view permissions
    await requirePermissionDBForAPI("permission:admin");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as PermissionCategory | null;

    const permissions = category
      ? await getPermissionsByCategory(category)
      : await getAllPermissions();

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
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
            : "Failed to fetch permissions",
      },
      { status: 500 },
    );
  }
}
