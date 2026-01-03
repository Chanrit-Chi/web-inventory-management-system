import { prisma } from "@/lib/prisma";
import { OrderDetailCreateSchema } from "@/schemas/order-details.schema";
import { OrderCreateSchema } from "@/schemas/order.schema";

export const saleService = {
  fetchSale: async () => {
    return prisma.order.findMany({
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
  },

  createSale: async (data: {
    customerId: string;
    paymentMethodId: number;
    totalPrice: number;
    discountPercent?: number;
    discountAmount?: number;
    taxPercent?: number;
    taxAmount?: number;
    orderDetails: {
      productId: string;
      variantId: number;
      quantity: number;
      unitPrice: number;
    }[];
  }) => {
    const {
      customerId,
      paymentMethodId,
      totalPrice,
      orderDetails,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
    } = data;

    console.log("Creating sale with data:", {
      customerId,
      paymentMethodId,
      totalPrice,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      orderDetailsCount: orderDetails.length,
    });

    const validatedData = OrderCreateSchema.parse({
      customerId,
      paymentMethodId,
      totalPrice,
      status: "COMPLETED",
      discountPercent: discountPercent ?? 0,
      discountAmount: discountAmount ?? 0,
      taxPercent: taxPercent ?? 0,
      taxAmount: taxAmount ?? 0,
    });

    console.log("Validated order data:", validatedData);

    const validatedOrderDetails = orderDetails.map((detail, index) => {
      console.log(`Validating order detail ${index}:`, detail);
      return OrderDetailCreateSchema.parse({
        orderId: 0, // Will be set after order creation
        productId: detail.productId,
        variantId: detail.variantId,
        unitPrice: detail.unitPrice,
        quantity: detail.quantity,
      });
    });

    console.log("Validated order details:", validatedOrderDetails);

    return await prisma.$transaction(async (tx) => {
      // Verify customer exists
      const customer = await tx.customer.findUnique({
        where: { id: validatedData.customerId },
      });
      if (!customer) {
        throw new Error(
          `Customer with ID "${validatedData.customerId}" not found`
        );
      }

      // Verify payment method exists
      const paymentMethod = await tx.paymentMethod.findUnique({
        where: { id: validatedData.paymentMethodId },
      });
      if (!paymentMethod) {
        throw new Error(
          `Payment method with ID "${validatedData.paymentMethodId}" not found`
        );
      }

      // Verify all products and variants exist
      for (const detail of validatedOrderDetails) {
        const product = await tx.product.findUnique({
          where: { id: detail.productId },
        });
        if (!product) {
          throw new Error(`Product with ID "${detail.productId}" not found`);
        }

        const variant = await tx.productVariant.findUnique({
          where: { id: detail.variantId },
        });
        if (!variant) {
          throw new Error(
            `Product variant with ID "${detail.variantId}" not found`
          );
        }

        // Verify variant belongs to the product
        if (variant.productId !== detail.productId) {
          throw new Error(
            `Variant ${detail.variantId} does not belong to product ${detail.productId}`
          );
        }
      }

      // Create the order
      const order = await tx.order.create({
        data: {
          customerId: validatedData.customerId,
          paymentMethodId: validatedData.paymentMethodId,
          totalPrice: validatedData.totalPrice,
          status: validatedData.status,
          discountPercent: validatedData.discountPercent,
          discountAmount: validatedData.discountAmount,
          taxPercent: validatedData.taxPercent,
          taxAmount: validatedData.taxAmount,
        },
      });

      // Create order details
      await tx.orderDetail.createMany({
        data: validatedOrderDetails.map((detail) => ({
          orderId: order.id,
          productId: detail.productId,
          variantId: detail.variantId,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
        })),
      });

      return order;
    });
  },
};

export type SaleService = typeof saleService;
