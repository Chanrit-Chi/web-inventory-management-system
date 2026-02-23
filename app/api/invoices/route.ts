import { invoiceService } from "@/lib/services/db/invoiceDbService";
import { NextResponse } from "next/server";
import { InvoiceStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as InvoiceStatus) || undefined;

    const result = await invoiceService.getInvoices({
      page,
      pageSize,
      search,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}
