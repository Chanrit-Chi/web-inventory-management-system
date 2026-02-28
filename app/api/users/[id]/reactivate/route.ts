import { userDbService } from "@/lib/services/db/userDbService";
import { requirePermission } from "@/lib/requirePermission";
import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("user:update");

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await userDbService.reactivateUser(id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error reactivating user:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to reactivate user" },
      { status: 500 },
    );
  }
}
