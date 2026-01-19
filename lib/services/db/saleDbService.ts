import { prisma } from "@/lib/prisma";
import {
  Order,
  OrderUpdate,
  OrderWithDetails,
} from "@/schemas/type-export.schema";

const saleSelectFields = {
  orderDetail: {
    select: {
      quantity: true,
      unitPrice: true,
      variant: true,
      product: {
        select: {
          name: true,
          sku: true,
        },
      },
    },
  },
  customer: {
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
    },
  },
  paymentMethod: { select: { name: true } },
};

export const saleService = {
  fetchSale: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>
  ) => {
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};
    const conditions: any[] = [];

    // Add search filter
    if (search && search.trim()) {
      const searchUpper = search.toUpperCase();
      const statusMatch = ["COMPLETED", "PENDING", "CANCELLED"].find((s) =>
        s.includes(searchUpper)
      );

      const orConditions: any[] = [
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { paymentMethod: { name: { contains: search, mode: "insensitive" } } },
      ];

      // Add status to search if it matches
      if (statusMatch) {
        orConditions.push({ status: statusMatch });
      }

      where.OR = orConditions;
    }

    // Add column filters
    if (filters) {
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters["paymentMethod.name"]) {
        where.paymentMethod = { name: filters["paymentMethod.name"] };
      }
    }

    console.log("Search query:", search);
    console.log("Filters:", filters);
    console.log("Where clause:", JSON.stringify(where, null, 2));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderDetail: saleSelectFields.orderDetail,
          customer: saleSelectFields.customer,
          paymentMethod: saleSelectFields.paymentMethod,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.order.count({ where }),
    ]);

    // Keep Decimal precision for monetary fields
    const data = orders.map((order) => ({
      ...order,
      totalPrice: order.totalPrice,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      orderDetail: order.orderDetail.map((detail) => ({
        ...detail,
        unitPrice: detail.unitPrice,
      })),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  fetchSaleById: async (id: number) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderDetail: saleSelectFields.orderDetail,
        customer: saleSelectFields.customer,
        paymentMethod: saleSelectFields.paymentMethod,
      },
    });

    if (!order) return null;

    return {
      ...order,
      totalPrice: order.totalPrice,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      orderDetail: order.orderDetail.map((detail) => ({
        ...detail,
        unitPrice: detail.unitPrice,
      })),
    };
  },

  createSale: async (data: OrderWithDetails): Promise<Order> => {
    return await prisma.$transaction(async (tx) => {
      // Separate orderDetails from order data
      const { orderDetails, ...orderData } = data;

      // Create the order without orderDetails
      const order = await tx.order.create({
        data: orderData,
      });

      // Create order details
      await tx.orderDetail.createMany({
        data: orderDetails.map((detail) => ({
          orderId: order.id,
          productId: detail.productId,
          variantId: detail.variantId,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
        })),
      });

      return {
        ...order,
        totalPrice: order.totalPrice,
        discountAmount: order.discountAmount,
        taxAmount: order.taxAmount,
      };
    });
  },

  updateSale: async (
    id: number,
    data: Partial<OrderUpdate>
  ): Promise<Order> => {
    return await prisma.$transaction(async (tx) => {
      // Separate orderDetails from the order data
      const { orderDetails, ...orderData } = data as Partial<OrderUpdate> & {
        orderDetails?: OrderWithDetails["orderDetails"];
      };

      // Update the order
      const order = await tx.order.update({
        where: { id },
        data: orderData,
      });

      // If orderDetails are provided, update them
      if (orderDetails && Array.isArray(orderDetails)) {
        // Delete existing order details
        await tx.orderDetail.deleteMany({
          where: { orderId: id },
        });

        // Create new order details
        await tx.orderDetail.createMany({
          data: orderDetails.map(
            (detail: OrderWithDetails["orderDetails"][number]) => ({
              orderId: id,
              productId: detail.productId,
              variantId: detail.variantId,
              unitPrice: detail.unitPrice,
              quantity: detail.quantity,
            })
          ),
        });
      }

      return {
        ...order,
        totalPrice: order.totalPrice,
        discountAmount: order.discountAmount,
        taxAmount: order.taxAmount,
      };
    });
  },
} as const;

export type SaleService = typeof saleService;
