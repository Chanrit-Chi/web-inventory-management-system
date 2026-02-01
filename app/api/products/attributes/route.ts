import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all attributes and their values
    const attributes = await prisma.productAttribute.findMany({
      include: {
        values: true,
      },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(attributes);
  } catch (error) {
    console.error("Error fetching product attributes:", error);
    return NextResponse.json(
      { error: "Failed to fetch attributes" },
      { status: 500 },
    );
  }
}
