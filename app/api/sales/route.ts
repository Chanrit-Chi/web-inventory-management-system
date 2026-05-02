
import { saleService } from "@/lib/services/db/saleDbService";
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

    // Parse filters from query params
    const filters: Record<string, string> = {};
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (status) filters.status = status;
    if (paymentMethod) filters["paymentMethod.name"] = paymentMethod;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const sales = await saleService.fetchSale(page, limit, search, filters);
    console.log("Fetched sales successfully:", sales);
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received sale data:", JSON.stringify(data, null, 2));
    const sale = await saleService.createSale(data);
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      {
        error: "Failed to create sale",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    console.log("Received sale update data:", JSON.stringify(data, null, 2));
    const sale = await saleService.updateSale(id, updateData);
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 },
    );
  }
}
