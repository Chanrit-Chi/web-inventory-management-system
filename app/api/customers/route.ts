import { customerService } from "@/lib/services/db/customerDbService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const customers = await customerService.fetchCustomers();
    console.log("Fetched customers successfully:", customers);
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received customer data:", JSON.stringify(data, null, 2));
    const customer = await customerService.createCustomer(data);
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    console.log(
      "Received customer update data:",
      JSON.stringify(data, null, 2)
    );
    const customer = await customerService.updateCustomer(id, updateData);
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing customer ID" },
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
