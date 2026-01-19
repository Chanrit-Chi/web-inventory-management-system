import { ProductVariantDbService } from "@/lib/services/db/productVairantDbServince";
import { NextResponse } from "next/server";

// GET /api/products/variants/[id] - Get variant by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = Number.parseInt(idParam);

    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid variant ID" },
        { status: 400 }
      );
    }

    const variant = await ProductVariantDbService.fetchVariantById(id);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Error fetching variant:", error);
    return NextResponse.json(
      { error: "Failed to fetch variant" },
      { status: 500 }
    );
  }
}

// PUT /api/products/variants/[id] - Update variant (add this later)
// DELETE /api/products/variants/[id] - Delete variant (add this later)
