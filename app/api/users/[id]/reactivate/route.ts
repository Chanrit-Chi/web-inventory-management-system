import { userDbService } from "@/lib/services/db/userDbService";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("user:update");

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await userDbService.reactivateUser(id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error reactivating user:", error);

    if (error instanceof Error) {
      // Handle authorization errors
      if (error.message.startsWith("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (error.message.startsWith("Forbidden:")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      // Handle role hierarchy violations
      if (error.message.includes("Only SUPER_ADMIN")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to reactivate user" },
      { status: 500 },
    );
  }
}
