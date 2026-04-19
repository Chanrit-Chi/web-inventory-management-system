import { paymentMethodDbService } from "@/lib/services/db/paymentMethodDbService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const paymentMethods = await paymentMethodDbService.getAll();
    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const newMethod = await paymentMethodDbService.create(name);
    return NextResponse.json(newMethod);
  } catch (error) {
    console.error("Error creating payment method:", error);
    return NextResponse.json(
      { error: "Failed to create payment method" },
      { status: 500 }
    );
  }
}
