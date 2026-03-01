import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { AttributeUpdateSchema } from "@/schemas/attribute.schema";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";

// PATCH - Update attribute
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermissionDBForAPI("product:update");

    const { id } = await params;
    const attributeId = Number.parseInt(id);

    if (Number.isNaN(attributeId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    // Check if attribute exists first
    const existing = await prisma.productAttribute.findUnique({
      where: { id: attributeId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 },
      );
    }

    // If name is being sent and hasn't changed, remove it from validation
    const bodyToValidate = { ...body };
    if (bodyToValidate.name === existing.name) {
      delete bodyToValidate.name;
    }

    const validatedData = AttributeUpdateSchema.parse({
      ...bodyToValidate,
      id: attributeId,
    });

    // If name is being updated, check for conflicts
    if (validatedData.name && validatedData.name !== existing.name) {
      const nameExists = await prisma.productAttribute.findUnique({
        where: { name: validatedData.name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Attribute with this name already exists" },
          { status: 400 },
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...updateData } = validatedData;
    const attribute = await prisma.productAttribute.update({
      where: { id: attributeId },
      data: updateData,
      include: {
        values: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("Error updating attribute:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to update attribute" },
      { status: 500 },
    );
  }
}

// DELETE - Delete attribute
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requirePermissionDBForAPI("product:delete");

    const { id } = await params;
    const attributeId = Number.parseInt(id);

    if (Number.isNaN(attributeId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check if attribute exists
    const existing = await prisma.productAttribute.findUnique({
      where: { id: attributeId },
      include: {
        products: true, // Check if linked to any products
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 },
      );
    }

    // Check if attribute is linked to any products
    if (existing.products && existing.products.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete attribute that is linked to products. Please remove the attribute from all products first.",
        },
        { status: 400 },
      );
    }

    // Delete attribute (cascade will delete values)
    await prisma.productAttribute.delete({
      where: { id: attributeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attribute:", error);

    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to delete attribute" },
      { status: 500 },
    );
  }
}
