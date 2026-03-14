import { prisma } from "@/lib/prisma";
import { InvoiceStatus, Prisma } from "@prisma/client";

export const invoiceService = {
  /**
   * Generates or updates an invoice for a given sale (order).
   * If an invoice already exists for the order, it updates it.
   * If not, it creates a new one.
   */
  generateInvoiceFromSale: async (orderId: number) => {
    // 1. Fetch the Order with all necessary details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderDetail: {
          include: {
            product: true,
            variant: true,
          },
        },
        invoice: true,
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // 2. Prepare Invoice Data
    // Generate invoice number: INV-{YEAR}{MONTH}-{ORDER_ID}
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const invoiceNumber = `INV-${year}${month}-${String(order.id).padStart(6, "0")}`;

    // Calculate subtotal from order details
    const subtotal = order.orderDetail.reduce((acc, item) => {
      return acc.plus(item.unitPrice.mul(item.quantity));
    }, new Prisma.Decimal(0));

    // Determine status
    let status: InvoiceStatus = InvoiceStatus.DRAFT;
    if (order.status === "COMPLETED") {
      status = InvoiceStatus.PAID;
    } else if (order.status === "PENDING") {
      status = InvoiceStatus.SENT; // or DRAFT
    }

    const invoiceData = {
      orderId: order.id,
      customerId: order.customerId,
      status: status,
      issuedDate: order.createdAt,
      dueDate: order.createdAt, // Default to immediate payment for POS sales
      subtotal: subtotal,
      taxPercent: order.taxPercent,
      taxAmount: order.taxAmount,
      discountPercent: order.discountPercent,
      discountAmount: order.discountAmount,
      totalAmount: order.totalPrice,
      notes: `Generated from Sale #${order.id}`,
    };

    return await prisma.$transaction(async (tx) => {
      let invoice;

      if (order.invoice) {
        // Update existing invoice
        invoice = await tx.invoice.update({
          where: { id: order.invoice.id },
          data: {
            ...invoiceData,
            invoiceNumber: order.invoice.invoiceNumber, // Preserve original invoice number
          },
        });

        // Delete existing items to replace them
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: invoice.id },
        });
      } else {
        // Create new invoice
        invoice = await tx.invoice.create({
          data: {
            ...invoiceData,
            invoiceNumber: invoiceNumber,
          },
        });
      }

      // Create Invoice Items
      if (order.orderDetail.length > 0) {
        await tx.invoiceItem.createMany({
          data: order.orderDetail.map((detail) => ({
            invoiceId: invoice.id,
            productId: detail.productId,
            productName: detail.product.name,
            variantId: detail.variantId,
            sku: detail.variant.sku,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            lineTotal: detail.unitPrice.mul(detail.quantity),
          })),
        });
      }

      return invoice;
    });
  },

  getInvoiceBySaleId: async (saleId: number) => {
    return await prisma.invoice.findUnique({
      where: { orderId: saleId },
      include: {
        invoiceItems: true,
        customer: true,
      },
    });
  },

  getInvoices: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: InvoiceStatus;
    startDate?: string;
    endDate?: string;
  }) => {
    const {
      page = 1,
      pageSize = 10,
      search,
      status,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.InvoiceWhereInput = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...((startDate || endDate) && {
        issuedDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && {
            lte: (() => {
              const d = new Date(endDate);
              d.setHours(23, 59, 59, 999);
              return d;
            })(),
          }),
        },
      }),
    };

    const [total, data] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          order: {
            include: {
              paymentMethod: true,
              orderDetail: {
                include: {
                  product: true,
                  variant: true,
                },
              },
            },
          },
        },
        orderBy: { issuedDate: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  getInvoiceById: async (id: string) => {
    return await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceItems: true,
        customer: true,
        order: {
          include: {
            paymentMethod: true,
            orderDetail: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
      },
    });
  },
};
