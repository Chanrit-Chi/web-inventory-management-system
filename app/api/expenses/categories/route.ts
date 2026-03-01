import { NextResponse } from "next/server";
import { expenseDbService } from "@/lib/services/db/expenseDbService";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { ExpenseCategoryCreateSchema } from "@/schemas/expense.schema";

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

export async function GET(request: Request) {
  try {
    await requirePermissionDBForAPI("expense:read");

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const categories = await expenseDbService.fetchCategories(includeInactive);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching expense categories:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    return NextResponse.json(
      { error: "Failed to fetch expense categories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermissionDBForAPI("expense:create");

    const body = await request.json();
    const data = ExpenseCategoryCreateSchema.parse(body);
    const category = await expenseDbService.createCategory(data);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating expense category:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create expense category" },
      { status: 500 },
    );
  }
}
