import { purchaseOrderService } from "@/lib/services/db/purchaseOrderDbService";
import { getServerSession } from "@/lib/getServerSession";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const search = searchParams.get("search") ?? undefined;

    const filters: Record<string, string> = {};
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    if (status) filters.status = status;
    if (supplierId) filters.supplierId = supplierId;

    const result = await purchaseOrderService.fetchPurchaseOrders(
      page,
      limit,
      search,
      filters,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const [data, session] = await Promise.all([
      request.json(),
      getServerSession(),
    ]);
    const createdBy = session?.user?.name ?? undefined;
    const order = await purchaseOrderService.createPurchaseOrder(
      data,
      createdBy,
    );
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      {
        error: "Failed to create purchase order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const [data, session] = await Promise.all([
      request.json(),
      getServerSession(),
    ]);
    const createdBy = session?.user?.name ?? undefined;
    const { id, ...updateData } = data;
    const order = await purchaseOrderService.updatePurchaseOrder(
      Number(id),
      updateData,
      createdBy,
    );
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      {
        error: "Failed to update purchase order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
