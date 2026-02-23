import { saleService } from "@/lib/services/db/saleDbService";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const numericId = Number.parseInt(id, 10);

    if (Number.isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const sale = await saleService.fetchSaleById(numericId);
    console.log("Fetched sale successfully:", sale);
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 },
    );
  }
};

export const PUT = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    console.log("=== PUT /api/sales/[id] started ===");

    const { id } = await params;
    console.log("Received ID parameter:", id);

    const numericId = Number.parseInt(id, 10);
    console.log("Parsed numeric ID:", numericId);

    if (Number.isNaN(numericId)) {
      console.error("Invalid ID format");
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    console.log("Attempting to parse request body...");
    const data = await request.json();
    console.log("Received sale update data:", JSON.stringify(data, null, 2));

    console.log("Calling saleService.updateSale...");
    const sale = await saleService.updateSale(numericId, data);
    console.log("Updated sale successfully:", JSON.stringify(sale, null, 2));

    return NextResponse.json(sale);
  } catch (error) {
    console.error("=== Error in PUT /api/sales/[id] ===");
    console.error("Error type:", typeof error);
    console.error("Error:", error);

    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Ensure we always return a proper error structure
    const errorResponse = {
      error: "Failed to update sale",
      details: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.name : typeof error,
    };

    console.error("Returning error response:", errorResponse);

    return NextResponse.json(errorResponse, { status: 500 });
  }
};
