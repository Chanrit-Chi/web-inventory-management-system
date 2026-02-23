import { quotationService } from "@/lib/services/db/quotationDbService";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method is required for conversion" },
        { status: 400 },
      );
    }

    const sale = await quotationService.convertToSale(id, paymentMethodId);
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error converting quotation to sale:", error);
    return NextResponse.json(
      {
        error: "Failed to convert quotation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
