import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/services/permission-service";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";

export async function GET(request: NextRequest) {
  try {
    await requirePermissionDBForAPI("permission:admin");

    const { searchParams } = new URL(request.url);

    const filters = {
      targetType: searchParams.get("targetType") || undefined,
      targetId: searchParams.get("targetId") || undefined,
      createdBy: searchParams.get("createdBy") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
      limit: searchParams.get("limit")
        ? Number.parseInt(searchParams.get("limit")!)
        : 50,
      offset: searchParams.get("offset")
        ? Number.parseInt(searchParams.get("offset")!)
        : 0,
    };

    const { logs, total } = await getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);

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
          error instanceof Error ? error.message : "Failed to fetch audit logs",
      },
      { status: 500 },
    );
  }
}
