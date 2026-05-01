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
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
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

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters?.startDate && { gte: new Date(filters.startDate) }),
        ...(filters?.endDate && {
          lte: (() => {
            const d = new Date(filters.endDate);
            d.setHours(23, 59, 59, 999);
            return d;
          })(),
        }),
      };
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: true,
          quotationItems: true,
        },
        orderBy: { [sortBy]: sortOrder },
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
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const count = await prisma.quotation.count();
    const quotationNumber = `QUO-${year}${month}-${String(count + 1).padStart(4, "0")}`;
    const { quotationItems, ...quotationData } = data;
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
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { quotationItems: true }
    });

    if (!existingQuotation) throw new Error("Quotation not found");

    const { quotationItems, ...quotationData } = data;
    // Sanitize data to avoid Prisma relation errors
    const sanitizedData = { ...quotationData } as Record<string, unknown>;
    if ("customer" in sanitizedData) delete sanitizedData.customer;

    return await prisma.$transaction(async (tx) => {
      // 1. Mark existing as REVISED
      await tx.quotation.update({
        where: { id },
        data: { status: "REVISED" }
      });

      // 2. Generate new version number
      const newVersion = existingQuotation.version + 1;
      const baseNumber = existingQuotation.quotationNumber.split('-v')[0];
      const newQuotationNumber = `${baseNumber}-v${newVersion}`;
      const originalId = existingQuotation.originalId || existingQuotation.id;

      // 3. Prepare merged data
      const {
        id: _oldId,
        quotationItems: _oldItems,
        createdAt: _oldCreated,
        updatedAt: _oldUpdated,
        quotationNumber: _oldNum,
        version: _oldVer,
        originalId: _oldOrigId,
        status: _oldStatus,
        ...baseExisting
      } = existingQuotation;
      /* eslint-enable @typescript-eslint/no-unused-vars */

      const mergedData = {
        ...baseExisting,
        ...sanitizedData
      };

      // 4. Create new quotation
      const quotation = await tx.quotation.create({
        data: {
          customerId: mergedData.customerId as string,
          issueDate: new Date(mergedData.issueDate as string | number | Date),
          validUntil: new Date(mergedData.validUntil as string | number | Date),
          subtotal: mergedData.subtotal as Prisma.Decimal | number,
          discountPercent: mergedData.discountPercent as number,
          discountAmount: mergedData.discountAmount as Prisma.Decimal | number,
          taxPercent: mergedData.taxPercent as number,
          taxAmount: mergedData.taxAmount as Prisma.Decimal | number,
          totalAmount: mergedData.totalAmount as Prisma.Decimal | number,
          notes: mergedData.notes as string | null,
          terms: mergedData.terms as string | null,
          createdBy: mergedData.createdBy as string | null,
          convertedOrderId: null, // Revisions are never pre-converted

          quotationNumber: newQuotationNumber,
          version: newVersion,
          originalId: originalId,
          status: (sanitizedData.status as QuotationStatus) || existingQuotation.status,

          quotationItems: {
            create: quotationItems ? quotationItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              variantId: item.variantId,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })) : existingQuotation.quotationItems.map(item => ({
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

      return quotation;
    });
  },


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
