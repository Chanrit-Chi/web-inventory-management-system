import { NextResponse } from "next/server";
import { expenseDbService } from "@/lib/services/db/expenseDbService";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";

function getAuthErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof Error)) return null;

  if (error.message.startsWith("Unauthorized")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error.message.startsWith("Forbidden:")) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return null;
}

function parseId(idParam: string): number {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid category id");
  }
  return id;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("expense:update");

    const { id: idParam } = await params;
    const id = parseId(idParam);

    const body = await request.json();
    const name = String(body?.name ?? "").trim();
    const description =
      typeof body?.description === "string"
        ? body.description.trim() || null
        : null;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 },
      );
    }

    const category = await expenseDbService.updateCategory(id, {
      name,
      description,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating expense category:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update expense category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("expense:delete");

    const { id: idParam } = await params;
    const id = parseId(idParam);

    const category = await expenseDbService.deleteCategory(id);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error deleting expense category:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete expense category" },
      { status: 500 },
    );
  }
}
