import { stockService } from "@/lib/services/db/stockDbService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { adjustments } = await request.json();

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return NextResponse.json(
        { error: "Adjustments must be a non-empty array" },
        { status: 400 },
      );
    }

    const results = await stockService.batchAdjustStock(adjustments);

    return NextResponse.json({
      message: `Successfully adjusted ${results.length} items`,
      count: results.length,
    });
  } catch (error: unknown) {
    console.error("Batch adjustment error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to perform bulk adjustment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
