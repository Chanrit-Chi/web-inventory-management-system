import { NextRequest, NextResponse } from "next/server";
import { invoiceService } from "@/lib/services/db/invoiceDbService";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const { amount, paymentMethodId, paymentDate, referenceNo, notes } = body;

    if (!amount || !paymentMethodId) {
      return NextResponse.json(
        { error: "Amount and Payment Method are required" },
        { status: 400 }
      );
    }

    const updatedInvoice = await invoiceService.recordInvoicePayment(id, {
      amount: Number(amount),
      paymentMethodId: Number(paymentMethodId),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      referenceNo,
      notes,
      createdBy: session.user.id,
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error: unknown) {
    console.error("Error recording invoice payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to record payment";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
