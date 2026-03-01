import { userDbService } from "@/lib/services/db/userDbService";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { UserUpdateSchema } from "@/schemas/user.schema";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("user:read");

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await userDbService.fetchUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("user:update");

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = UserUpdateSchema.parse(body);

    const user = await userDbService.updateUser(id, validatedData);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error) {
      // Handle authorization errors
      if (error.message.startsWith("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (error.message.startsWith("Forbidden:")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      // Handle role hierarchy violations
      if (
        error.message.includes("Only SUPER_ADMIN") ||
        error.message.includes("Cannot modify") ||
        error.message.includes("Cannot deactivate the last")
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("user:delete");

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await userDbService.deleteUser(id);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error instanceof Error) {
      // Handle authorization errors
      if (error.message.startsWith("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (error.message.startsWith("Forbidden:")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }

      // Handle role hierarchy violations
      if (
        error.message.includes("Only SUPER_ADMIN") ||
        error.message.includes("Cannot deactivate the last")
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
