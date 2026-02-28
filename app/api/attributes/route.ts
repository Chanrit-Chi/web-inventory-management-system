import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { AttributeCreateSchema } from "@/schemas/attribute.schema";
import { requirePermission } from "@/lib/requirePermission";

// GET - List all attributes with their values
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attributes = await prisma.productAttribute.findMany({
      include: {
        values: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(attributes);
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return NextResponse.json(
      { error: "Failed to fetch attributes" },
      { status: 500 },
    );
  }
}

// POST - Create new attribute
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    await requirePermission("product:create");

    const body = await request.json();
    const validatedData = AttributeCreateSchema.parse(body);

    // Check if attribute with same name already exists
    const existing = await prisma.productAttribute.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Attribute with this name already exists" },
        { status: 400 },
      );
    }

    const attribute = await prisma.productAttribute.create({
      data: validatedData,
      include: {
        values: true,
      },
    });

    return NextResponse.json(attribute, { status: 201 });
  } catch (error) {
    console.error("Error creating attribute:", error);

    if (error instanceof Error && error.message.includes("permission")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to create attribute" },
      { status: 500 },
    );
  }
}
