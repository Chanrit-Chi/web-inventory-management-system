import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { AttributeValueUpdateSchema } from "@/schemas/attribute.schema";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";

// PATCH - Update attribute value
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ valueId: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermissionDBForAPI("product:update");

    const { valueId } = await params;
    const id = Number.parseInt(valueId);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    const validatedData = AttributeValueUpdateSchema.parse({
      ...body,
      id,
    });

    // Check if value exists
    const existing = await prisma.productAttributeValue.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribute value not found" },
        { status: 404 },
      );
    }

    // If value is being updated, check for conflicts
    if (validatedData.value && validatedData.value !== existing.value) {
      const valueExists = await prisma.productAttributeValue.findUnique({
        where: {
          attributeId_value: {
            attributeId: existing.attributeId,
            value: validatedData.value,
          },
        },
      });

      if (valueExists) {
        return NextResponse.json(
          { error: "Value already exists for this attribute" },
          { status: 400 },
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validatedData;

    // Default displayValue to value if empty
    if (updateData.displayValue !== undefined) {
      updateData.displayValue =
        updateData.displayValue?.trim() ||
        validatedData.value ||
        existing.value;
    }

    const value = await prisma.productAttributeValue.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(value);
  } catch (error) {
    console.error("Error updating attribute value:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to update attribute value" },
      { status: 500 },
    );
  }
}

// DELETE - Delete attribute value
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ valueId: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermissionDBForAPI("product:delete");

    const { valueId } = await params;
    const id = Number.parseInt(valueId);

    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check if value exists
    const existing = await prisma.productAttributeValue.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribute value not found" },
        { status: 404 },
      );
    }

    // Delete value
    await prisma.productAttributeValue.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attribute value:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to delete attribute value" },
      { status: 500 },
    );
  }
}
