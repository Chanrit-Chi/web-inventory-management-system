import { purchaseOrderService } from "@/lib/services/db/purchaseOrderDbService";
import { getServerSession } from "@/lib/getServerSession";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await purchaseOrderService.getPurchaseOrderById(Number(id));
    if (!order) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [{ id }, session] = await Promise.all([params, getServerSession()]);
    const createdBy = session?.user?.name ?? undefined;
    await purchaseOrderService.deletePurchaseOrder(Number(id), createdBy);
    return NextResponse.json({
      message: "Purchase order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      {
        error: "Failed to delete purchase order",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
