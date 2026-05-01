import { prisma } from "@/lib/prisma";
import { InvoiceStatus, Prisma, PaymentStatus, orderStatus } from "@prisma/client";

export const invoiceService = {
  generateInvoiceFromSale: async (orderId: number, initialPaymentAmount?: number) => {
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
    let amountPaid = new Prisma.Decimal(0);

    if (initialPaymentAmount !== undefined) {
      amountPaid = new Prisma.Decimal(initialPaymentAmount);
      if (amountPaid.gte(order.totalPrice)) {
        status = InvoiceStatus.PAID;
      } else if (amountPaid.gt(0)) {
        status = InvoiceStatus.PARTIAL;
      } else if (order.status === orderStatus.PENDING || order.status === orderStatus.COMPLETED) {
        status = InvoiceStatus.SENT;
      }
    } else {
      if (order.status === orderStatus.COMPLETED || order.paymentStatus === PaymentStatus.PAID) {
        status = InvoiceStatus.PAID;
        amountPaid = order.totalPrice;
      } else if (order.paymentStatus === PaymentStatus.PARTIAL) {
        status = InvoiceStatus.PARTIAL;
      } else if (order.status === orderStatus.PENDING) {
        status = InvoiceStatus.SENT;
      }
    }

    const invoiceData = {
      orderId: order.id,
      customerId: order.customerId,
      status: status,
      issuedDate: order.createdAt,
      dueDate: order.createdAt,
      subtotal: subtotal,
      taxPercent: order.taxPercent,
      taxAmount: order.taxAmount,
      discountPercent: order.discountPercent,
      discountAmount: order.discountAmount,
      totalAmount: order.totalPrice,
      amountPaid: amountPaid,
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

      // Record initial payment if applicable
      if (initialPaymentAmount !== undefined && initialPaymentAmount > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: invoice.id,
            amount: new Prisma.Decimal(initialPaymentAmount),
            paymentDate: invoice.issuedDate,
            paymentMethodId: order.paymentMethodId,
            notes: "Initial payment during sale creation",
          },
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

  recordInvoicePayment: async (
    invoiceId: string,
    data: {
      amount: number;
      paymentMethodId: number;
      paymentDate?: Date;
      referenceNo?: string;
      notes?: string;
      createdBy?: string;
    }
  ) => {
    return await prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: new Prisma.Decimal(data.amount),
          paymentMethodId: data.paymentMethodId,
          paymentDate: data.paymentDate || new Date(),
          referenceNo: data.referenceNo,
          notes: data.notes,
          createdBy: data.createdBy,
        },
      });

      // 2. Recalculate amountPaid
      const allPayments = await tx.invoicePayment.findMany({
        where: { invoiceId },
      });
      const totalPaid = allPayments.reduce((acc, p) => acc.plus(p.amount), new Prisma.Decimal(0));

      // 3. Get invoice to check totalAmount
      const invoice = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
      });

      let newStatus: InvoiceStatus = InvoiceStatus.PARTIAL;
      let orderPaymentStatus: PaymentStatus = PaymentStatus.PARTIAL;

      if (totalPaid.gte(invoice.totalAmount)) {
        newStatus = InvoiceStatus.PAID;
        orderPaymentStatus = PaymentStatus.PAID;
      }

      // 4. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: totalPaid,
          status: newStatus,
        },
      });

      // 5. Update Order
      if (invoice.orderId) {
        await tx.order.update({
          where: { id: invoice.orderId },
          data: {
            paymentStatus: orderPaymentStatus,
            ...(orderPaymentStatus === PaymentStatus.PAID ? { status: orderStatus.COMPLETED, pendingReason: null } : {}),
          },
        });
      }

      return updatedInvoice;
    });
  },
};
