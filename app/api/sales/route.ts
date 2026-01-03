//implementation of sale api route
import { saleService } from "@/lib/services/db/saleDbService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sales = await saleService.fetchSale();
    console.log("Fetched sales successfully:", sales);
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
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
      { status: 500 }
    );
  }
}
