import { customerService } from "@/lib/services/db/customerDbService";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await customerService.getCustomerById(id);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }
    const customer = await customerService.deleteCustomer(id);
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error deleting customer:", error);

    // Handle foreign key constraint violation
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing orders." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
