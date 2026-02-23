import { quotationService } from "@/lib/services/db/quotationDbService";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") || "1", 10),
    );
    const limit = Math.max(
      1,
      Math.min(100, Number.parseInt(searchParams.get("limit") || "10", 10)),
    );
    const search = searchParams.get("search") || undefined;

    const filters: Record<string, string> = {};
    const status = searchParams.get("status");
    if (status) filters.status = status;

    const result = await quotationService.fetchQuotations(
      page,
      limit,
      search,
      filters,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const quotation = await quotationService.createQuotation(data);
    return NextResponse.json(quotation);
  } catch (error) {
    console.error("Error creating quotation:", error);
    return NextResponse.json(
      {
        error: "Failed to create quotation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
