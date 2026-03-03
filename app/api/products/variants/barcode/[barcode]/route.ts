import { ProductVariantDbService } from "@/lib/services/db/productVairantDbServince";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ barcode: string }> },
) {
  try {
    const { barcode } = await params;
    const variant =
      await ProductVariantDbService.fetchVariantByBarcode(barcode);

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Error fetching variant by barcode:", error);
    return NextResponse.json(
      { error: "Failed to fetch variant" },
      { status: 500 },
    );
  }
}
