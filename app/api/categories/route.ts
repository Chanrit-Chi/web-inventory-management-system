import { CategoryDbService } from "@/lib/services/db/categoryDbService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await CategoryDbService.fetchCategories();
    console.log("Fetched categories successfully:", categories);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received category data:", JSON.stringify(data, null, 2));
    const category = await CategoryDbService.createCategory(data);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    console.log(
      "Received category update data:",
      JSON.stringify(data, null, 2)
    );
    const category = await CategoryDbService.updateCategory(id, updateData);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}
