import { stockService } from "@/lib/services/db/stockDbService";
import { NextResponse } from "next/server";
import { StockMovementType } from "@prisma/client";
import { getServerSession } from "@/lib/getServerSession";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const movementType =
      (searchParams.get("movementType") as StockMovementType) || undefined;
    const variantId = searchParams.get("variantId")
      ? Number.parseInt(searchParams.get("variantId")!, 10)
      : undefined;

    const result = await stockService.fetchStockMovements({
      page,
      pageSize,
      search,
      movementType,
      variantId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const createdBy = session?.user?.name ?? undefined;

    const body = await request.json();
    const { variantId, movementType, quantity, reason } = body;

    if (!variantId || !movementType || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: variantId, movementType, quantity" },
        { status: 400 },
      );
    }

    const result = await stockService.adjustStock({
      variantId: Number(variantId),
      movementType,
      quantity: Number(quantity),
      reason,
      createdBy,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to adjust stock",
      },
      { status: 500 },
    );
  }
}
