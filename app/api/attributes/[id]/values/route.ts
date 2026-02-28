import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { AttributeValueCreateSchema } from "@/schemas/attribute.schema";
import { requirePermission } from "@/lib/requirePermission";

// POST - Add value to attribute
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermission("product:create");

    const { id } = await params;
    const attributeId = Number.parseInt(id);

    if (Number.isNaN(attributeId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check if attribute exists
    const attribute = await prisma.productAttribute.findUnique({
      where: { id: attributeId },
    });

    if (!attribute) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validatedData = AttributeValueCreateSchema.parse(body);

    // Default displayValue to value if not provided or empty
    const displayValue =
      validatedData.displayValue?.trim() || validatedData.value;

    // Check if value already exists for this attribute
    const existing = await prisma.productAttributeValue.findUnique({
      where: {
        attributeId_value: {
          attributeId,
          value: validatedData.value,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Value already exists for this attribute" },
        { status: 400 },
      );
    }

    const value = await prisma.productAttributeValue.create({
      data: {
        ...validatedData,
        displayValue,
        attributeId,
      },
    });

    return NextResponse.json(value, { status: 201 });
  } catch (error) {
    console.error("Error adding attribute value:", error);

    if (error instanceof Error && error.message.includes("permission")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to add attribute value" },
      { status: 500 },
    );
  }
}
