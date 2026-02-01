import { UnitDbService } from "@/lib/services/db/unitDbService";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const units = await UnitDbService.fetchUnits();
    console.log("Fetched units successfully:", units);
    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Received unit data:", JSON.stringify(data, null, 2));

    // Check for unique name constraint
    const existingUnit = await prisma.unit.findFirst({
      where: { name: data.name },
    });
    if (existingUnit) {
      return NextResponse.json(
        { error: "Unit name already exists" },
        { status: 400 },
      );
    }

    const unit = await UnitDbService.createUnit(data);
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 },
    );
  }
}
