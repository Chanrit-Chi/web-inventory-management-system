import { prisma } from "@/lib/prisma";
import { Prisma, Quotation, QuotationStatus } from "@prisma/client";
import { QuotationWithItems } from "@/schemas/type-export.schema";
import { saleService } from "./saleDbService";

export const quotationService = {
  fetchQuotations: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>,
  ) => {
    const skip = (page - 1) * limit;
    const where: Prisma.QuotationWhereInput = {};

    if (search?.trim()) {
      where.OR = [
        { quotationNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status as QuotationStatus;
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: true,
          quotationItems: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.quotation.count({ where }),
    ]);

    return {
      data: quotations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getQuotationById: async (id: string) => {
    return await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        quotationItems: true,
      },
    });
  },

  createQuotation: async (data: QuotationWithItems): Promise<Quotation> => {
    // Generate Quotation Number: QUO-{YEAR}-{COUNTER}
    // For simplicity, we can use a basic random or timestamp logic,
    // but ideally we should have a sequence. Using Date for now.
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Simple ID generation for now.
    // In a real app, you'd want to query the last ID or use a dedicated sequence table.
    const count = await prisma.quotation.count();
    const quotationNumber = `QUO-${year}${month}-${String(count + 1).padStart(4, "0")}`;

    const { quotationItems, ...quotationData } = data;
    // Sanitize data to avoid Prisma relation errors
    const sanitizedData = { ...quotationData } as Record<string, unknown>;
    if ("customer" in sanitizedData) delete sanitizedData.customer;

    return await prisma.quotation.create({
      data: {
        ...(sanitizedData as Prisma.QuotationUncheckedCreateInput),
        quotationNumber,
        quotationItems: {
          create: quotationItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });
  },

  updateQuotation: async (id: string, data: Partial<QuotationWithItems>) => {
    const { quotationItems, ...quotationData } = data;
    // Sanitize data to avoid Prisma relation errors
    const sanitizedData = { ...quotationData } as Record<string, unknown>;
    if ("customer" in sanitizedData) delete sanitizedData.customer;

    return await prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.update({
        where: { id },
        data: sanitizedData as Prisma.QuotationUncheckedUpdateInput,
      });

      if (quotationItems) {
        // Replace items
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        await tx.quotationItem.createMany({
          data: quotationItems.map((item) => ({
            quotationId: id,
            productId: item.productId,
            productName: item.productName,
            variantId: item.variantId,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        });
      }
      return quotation;
    });
  },

  /**
   * Converts a Quotation to a Sale (Order).
   * 1. Validates quotation status.
   * 2. Creates an Order using saleDbService.
   * 3. Updates Quotation status to CONVERTED and links the Order.
   */
  convertToSale: async (quotationId: string, paymentMethodId: number) => {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { quotationItems: true },
    });

    if (!quotation) throw new Error("Quotation not found");
    if (quotation.status === "CONVERTED")
      throw new Error("Quotation already converted");
    if (quotation.status === "EXPIRED") throw new Error("Quotation is expired");

    // Map Quotation to Order
    const orderData = {
      customerId: quotation.customerId,
      paymentMethodId: paymentMethodId,
      status: "COMPLETED" as const, // Finalized on conversion
      totalPrice: new Prisma.Decimal(quotation.totalAmount),
      discountPercent: quotation.discountPercent,
      discountAmount: new Prisma.Decimal(quotation.discountAmount),
      taxPercent: quotation.taxPercent,
      taxAmount: new Prisma.Decimal(quotation.taxAmount),

      orderDetails: quotation.quotationItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId!, // Assuming variantId exists for now
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(item.unitPrice),
      })),
    };

    // Use saleService to create the order (handles inventory, validation, invoice gen, etc.)
    // Note: We need to handle the case where variantId might be null in Quotation but required in Order
    // If your logic allows null variants in Quotation, you need to ensure they are valid for Order.
    // Based on schema, OrderDetail `variantId` is Int (required). QuotationItem `variantId` is Int? (optional).
    // If variantId is missing, we can't create an order.

    const validOrderDetails = orderData.orderDetails.filter(
      (od) => od.variantId !== null,
    );
    if (validOrderDetails.length !== orderData.orderDetails.length) {
      throw new Error(
        "Cannot convert quotation with items missing variant information.",
      );
    }

    // Proactive stock validation
    for (const item of quotation.quotationItems) {
      if (!item.variantId) continue;
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true, sku: true },
      });

      if (!variant) {
        throw new Error(`Product variant with SKU ${item.sku} not found.`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for item "${item.productName}" (SKU: ${item.sku}). Available: ${variant.stock}, Required: ${item.quantity}`,
        );
      }
    }

    // Create the sale
    const newSale = await saleService.createSale(
      orderData as unknown as Parameters<typeof saleService.createSale>[0],
    );

    // Update Quotation
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: "CONVERTED",
        convertedOrderId: newSale.id,
      },
    });

    return newSale;
  },

  markAsSent: async (id: string) => {
    return await prisma.quotation.update({
      where: { id },
      data: { status: "SENT" },
    });
  },

  markAsAccepted: async (id: string) => {
    return await prisma.quotation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });
  },

  markAsRejected: async (id: string) => {
    return await prisma.quotation.update({
      where: { id },
      data: { status: "REJECTED" },
    });
  },

  deleteQuotation: async (id: string) => {
    return await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      return await tx.quotation.delete({ where: { id } });
    });
  },
};
