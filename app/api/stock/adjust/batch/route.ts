import { stockService } from "@/lib/services/db/stockDbService";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/getServerSession";

type AdjustmentInput = Parameters<
  typeof stockService.batchAdjustStock
>[0][number];

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const createdBy = session?.user?.name ?? undefined;

    const { adjustments } = await request.json();

    if (!Array.isArray(adjustments) || adjustments.length === 0) {
      return NextResponse.json(
        { error: "Adjustments must be a non-empty array" },
        { status: 400 },
      );
    }

    const adjustmentsWithUser = (adjustments as AdjustmentInput[]).map(
      (adj) => ({ ...adj, createdBy }),
    );

    const results = await stockService.batchAdjustStock(adjustmentsWithUser);

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
