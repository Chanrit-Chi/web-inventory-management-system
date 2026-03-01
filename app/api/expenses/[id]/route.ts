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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermissionDBForAPI("expense:read");

    const { id } = await params;
    const expense = await expenseDbService.fetchExpenseById(id);

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    return NextResponse.json(
      { error: "Failed to fetch expense" },
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

    const { id } = await params;
    const deleted = await expenseDbService.deleteExpense(id);

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Error deleting expense:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 },
    );
  }
}
