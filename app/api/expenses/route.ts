import { NextResponse } from "next/server";
import { expenseDbService } from "@/lib/services/db/expenseDbService";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import {
  ExpenseCreateSchema,
  ExpenseUpdateSchema,
} from "@/schemas/expense.schema";
import { getServerSession } from "@/lib/getServerSession";

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

export async function GET() {
  try {
    await requirePermissionDBForAPI("expense:read");
    const expenses = await expenseDbService.fetchExpenses();
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermissionDBForAPI("expense:create");

    const body = await request.json();
    const data = ExpenseCreateSchema.parse(body);
    const session = await getServerSession();

    const expense = await expenseDbService.createExpense(
      data,
      session?.user?.id,
    );
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermissionDBForAPI("expense:update");

    const body = await request.json();
    const { id, ...payload } = body as { id?: string } & Record<
      string,
      unknown
    >;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 },
      );
    }

    const data = ExpenseUpdateSchema.parse(payload);
    const session = await getServerSession();

    const expense = await expenseDbService.updateExpense(
      id,
      data,
      session?.user?.id,
    );
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 },
    );
  }
}
