import { CategoryDbService } from "@/lib/services/db/categoryDbService";
import { CategoryCreateSchema } from "@/schemas/category.schema";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  const category = await CategoryDbService.deleteCategory(Number(id));
  return NextResponse.json(category);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = CategoryCreateSchema.parse(body);

    const category = await CategoryDbService.updateCategory(
      Number(id),
      validatedData
    );

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }
    const category = await CategoryDbService.fetchCategoryById(Number(id));

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
