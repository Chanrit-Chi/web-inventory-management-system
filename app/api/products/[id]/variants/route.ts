import { ProductVariantDbService } from "@/lib/services/db/productVairantDbServince";
import { NextResponse } from "next/server";

// GET /api/products/[id]/variants - Fetch variants for a specific product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");

    // Fetch variants for this product
    const variants = await ProductVariantDbService.fetchVariantsByProduct(
      id,
      page,
      limit,
    );

    // Get total count for pagination
    const total = await ProductVariantDbService.countVariants({
      productId: id,
    });

    return NextResponse.json({
      data: variants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching variants for product:", error);
    return NextResponse.json(
      { error: "Failed to fetch variants for product" },
      { status: 500 },
    );
  }
}
