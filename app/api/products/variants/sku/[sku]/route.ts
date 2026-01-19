import { ProductVariantDbService } from "@/lib/services/db/productVairantDbServince";
import { NextResponse } from "next/server";

// GET /api/products/variants/sku/[sku] - Get variant by SKU
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  try {
    const { sku } = await params;
    const variant = await ProductVariantDbService.fetchVariantsBySku(sku);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Error fetching variant by SKU:", error);
    return NextResponse.json(
      { error: "Failed to fetch variant" },
      { status: 500 }
    );
  }
}
