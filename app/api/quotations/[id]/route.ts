import { quotationService } from "@/lib/services/db/quotationDbService";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const quotation = await quotationService.getQuotationById(id);
    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error fetching quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotation" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const existing = await quotationService.getQuotationById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Quotation not found" },
        { status: 404 },
      );
    }
    if (existing.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Cannot edit a converted quotation" },
        { status: 403 },
      );
    }

    const data = await request.json();
    const quotation = await quotationService.updateQuotation(id, data);
    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error updating quotation:", error);
    return NextResponse.json(
      { error: "Failed to update quotation" },
      { status: 500 },
    );
  }
}

// Optional: Add DELETE if needed in schema/logic
