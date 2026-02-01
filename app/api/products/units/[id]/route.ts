import { UnitDbService } from "@/lib/services/db/unitDbService";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("Deleting unit with id:", id);
    const unit = await UnitDbService.deleteUnit(Number(id));
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await request.json();
    console.log("Received unit update data:", JSON.stringify(data, null, 2));

    // Check for unique name constraint
    if (data.name) {
      const existingUnit = await prisma.unit.findFirst({
        where: {
          name: data.name,
          NOT: { id: Number(id) },
        },
      });
      if (existingUnit) {
        return NextResponse.json(
          { error: "Unit name already exists" },
          { status: 400 },
        );
      }
    }

    const unit = await UnitDbService.updateUnit(Number(id), data);
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Failed to update unit" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const unit = await UnitDbService.fetchUnitById(Number(id));
    console.log("Fetched unit successfully:", unit);
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit" },
      { status: 500 },
    );
  }
}
