import { ProductVariantDbService } from "@/lib/services/db/productVairantDbServince";
import { NextResponse } from "next/server";

// GET /api/products/variants - Fetch all variants with pagination & filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const productId = searchParams.get("productId") || undefined;
    const searchSku = searchParams.get("searchSku") || undefined;
    const lowStock = searchParams.get("lowStock") === "true";

    // Fetch variants with filters
    const variants = await ProductVariantDbService.fetchVariant(page, limit, {
      productId,
      searchSku,
      lowStock,
    });

    // Get total count for pagination
    const total = await ProductVariantDbService.countVariants({
      productId,
      lowStock,
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
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 }
    );
  }
}

// POST /api/products/variants - Create a new variant
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const variant = await ProductVariantDbService.createVariant(data);
    console.log("Created product variant successfully:", variant);
    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error("Error creating product variant:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create product variant";
    const status =
      error instanceof Error && message.includes("Attribute value") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
