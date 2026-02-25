import { supplierService } from "@/lib/services/db/supplierDbService";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 10);
    const search = searchParams.get("search") ?? undefined;

    if (searchParams.get("all") === "true") {
      const suppliers = await supplierService.getAllSuppliers();
      return NextResponse.json(suppliers);
    }

    const result = await supplierService.fetchSuppliers(page, limit, search);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supplier = await supplierService.createSupplier(data);
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error creating supplier:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        const target = Array.isArray(error.meta.target)
          ? error.meta.target.join(", ")
          : error.meta.target;
        return NextResponse.json(
          { error: `A supplier with this ${target} already exists.` },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    const supplier = await supplierService.updateSupplier(id, updateData);
    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        const target = Array.isArray(error.meta.target)
          ? error.meta.target.join(", ")
          : error.meta.target;
        return NextResponse.json(
          { error: `A supplier with this ${target} already exists.` },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 },
    );
  }
}
