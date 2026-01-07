import { prisma } from "@/lib/prisma";
import {
  Order,
  OrderUpdate,
  OrderWithDetails,
} from "@/schemas/type-export.schema";

export const saleService = {
  fetchSale: async () => {
    const orders = await prisma.order.findMany({
      include: {
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Convert Decimal fields to numbers
    return orders.map((order) => ({
      ...order,
      totalPrice: order.totalPrice.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      orderDetail: order.orderDetail.map((detail) => ({
        ...detail,
        unitPrice: detail.unitPrice.toNumber(),
      })),
    }));
  },

  fetchSaleById: async (id: number) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!order) return null;

    return {
      ...order,
      totalPrice: order.totalPrice.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      orderDetail: order.orderDetail.map((detail) => ({
        ...detail,
        unitPrice: detail.unitPrice.toNumber(),
      })),
    };
  },

  createSale: async (data: OrderWithDetails): Promise<Order> => {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          paymentMethodId: data.paymentMethodId,
          totalPrice: data.totalPrice,
          status: "COMPLETED",
          discountPercent: data.discountPercent ?? 0,
          discountAmount: data.discountAmount ?? 0,
          taxPercent: data.taxPercent ?? 0,
          taxAmount: data.taxAmount ?? 0,
        },
      });

      // Create order details
      await tx.orderDetail.createMany({
        data: data.orderDetails.map((detail) => ({
          orderId: order.id,
          productId: detail.productId,
          variantId: detail.variantId,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
        })),
      });

      return {
        ...order,
        totalPrice: order.totalPrice.toNumber(),
        discountAmount: order.discountAmount.toNumber(),
        taxAmount: order.taxAmount.toNumber(),
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
        totalPrice: order.totalPrice.toNumber(),
        discountAmount: order.discountAmount.toNumber(),
        taxAmount: order.taxAmount.toNumber(),
      };
    });
  },
};

export type SaleService = typeof saleService;
