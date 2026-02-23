import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  Order,
  OrderWithDetails,
  OrderWithDetailsUpdate,
} from "@/schemas/type-export.schema";
import { invoiceService } from "./invoiceDbService";

const saleSelectFields = {
  id: true,
  customerId: true,
  totalPrice: true,
  status: true,
  paymentMethodId: true,
  discountPercent: true,
  discountAmount: true,
  taxPercent: true,
  taxAmount: true,
  createdAt: true,
  updatedAt: true,
  orderDetail: {
    select: {
      productId: true,
      variantId: true,
      quantity: true,
      unitPrice: true,
      variant: {
        select: {
          id: true,
          sku: true,
          stock: true,
          attributes: {
            include: {
              value: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
      },
      product: {
        select: {
          name: true,
          sku: true,
          image: true,
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

/**
 * Helper function to adjust inventory levels and record stock movements.
 * Handles additions, removals, quantity changes, and status-based adjustments (e.g., cancellations).
 */
async function adjustInventory(
  tx: Prisma.TransactionClient,
  orderId: number,
  oldItems: { variantId: number; quantity: number }[],
  newItems: { variantId: number; quantity: number }[],
  oldStatus: string,
  newStatus: string,
  reason: string,
) {
  const isOldCancelled = oldStatus === "CANCELLED";
  const isNewCancelled = newStatus === "CANCELLED";

  // Calculate effective quantities based on status
  // If status is CANCELLED, effective quantity is 0 (as if it doesn't exist in stock)
  const existingQtyMap = new Map<number, number>();
  oldItems.forEach((d) => {
    const qty = isOldCancelled ? 0 : d.quantity;
    existingQtyMap.set(
      d.variantId,
      (existingQtyMap.get(d.variantId) || 0) + qty,
    );
  });

  const newQtyMap = new Map<number, number>();
  newItems.forEach((d) => {
    const qty = isNewCancelled ? 0 : d.quantity;
    newQtyMap.set(d.variantId, (newQtyMap.get(d.variantId) || 0) + qty);
  });

  // Get union of all variant IDs
  const allVariantIds = Array.from(
    new Set([...existingQtyMap.keys(), ...newQtyMap.keys()]),
  );

  for (const vId of allVariantIds) {
    const oldQty = existingQtyMap.get(vId) || 0;
    const newQty = newQtyMap.get(vId) || 0;
    const delta = newQty - oldQty;

    if (delta !== 0) {
      const variant = await tx.productVariant.findUnique({
        where: { id: vId },
        select: { stock: true },
      });

      if (!variant) {
        throw new Error(
          `Product variant with ID ${vId} not found during inventory adjustment`,
        );
      }

      // Check if we have enough stock for a deduction (delta > 0)
      if (delta > 0 && variant.stock < delta) {
        throw new Error(
          `Insufficient stock for variant ID ${vId}. Available: ${variant.stock}, Additional requested: ${delta}`,
        );
      }

      const previousStock = variant.stock;
      const newStock = previousStock - delta;

      // Update stock
      await tx.productVariant.update({
        where: { id: vId },
        data: { stock: { decrement: delta } },
      });

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          variantId: vId,
          movementType: delta > 0 ? "SALE" : "RETURN",
          quantity: Math.abs(delta),
          previousStock,
          newStock,
          orderId,
          reason,
        },
      });
    }
  }
}

export const saleService = {
  fetchSale: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: {
      status?: string;
      customerId?: string;
    },
  ) => {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(search && {
        OR: [
          ...(Number.isNaN(Number(search)) ? [] : [{ id: Number(search) }]),
          { customer: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...(filters?.status && {
        status: filters.status as Prisma.EnumorderStatusFilter,
      }),
      ...(filters?.customerId && { customerId: filters.customerId }),
    };

    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        select: saleSelectFields,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  fetchSaleById: async (id: number) => {
    return prisma.order.findUnique({
      where: { id },
      select: saleSelectFields,
    });
  },

  createSale: async (data: OrderWithDetails): Promise<Order> => {
    const result = await prisma.$transaction(async (tx) => {
      // Separate orderDetails from order data
      const { orderDetails, ...orderData } = data;

      // Create the order without orderDetails
      const order = await tx.order.create({
        data: orderData,
      });

      // 1. Create Order Detail records
      await tx.orderDetail.createMany({
        data: orderDetails.map((detail) => ({
          orderId: order.id,
          productId: detail.productId,
          variantId: detail.variantId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice ?? new Prisma.Decimal(0),
        })),
      });

      // 2. Adjust inventory using helper
      await adjustInventory(
        tx,
        order.id,
        [], // No previous items
        orderDetails,
        "DRAFT", // Initial status (not cancelled)
        orderData.status || "COMPLETED",
        `Sale #${order.id}`,
      );

      return {
        ...order,
        totalPrice: order.totalPrice,
        discountAmount: order.discountAmount,
        taxAmount: order.taxAmount,
      };
    });

    try {
      // Generate invoice asynchronously after sale creation
      await invoiceService.generateInvoiceFromSale(result.id);
    } catch (error) {
      console.error("Failed to generate invoice for new sale:", error);
    }

    return result;
  },

  updateSale: async (
    id: number,
    data: OrderWithDetailsUpdate,
  ): Promise<Order> => {
    console.log("=== updateSale starting ===", { id, data });

    const result = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { orderDetail: true },
      });

      if (!existingOrder) throw new Error("Order not found");

      const existingOrderDetails = existingOrder.orderDetail;

      // Separate orderDetails from update data
      const { orderDetails, ...updateData } = data;

      // Update Order Header
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData as Prisma.OrderUpdateInput,
      });

      console.log("Order header updated");

      // Handle Order Details and Inventory
      if (orderDetails && Array.isArray(orderDetails)) {
        console.log("Adjusting inventory and updating details...");

        // 1. Adjust Inventory using helper
        await adjustInventory(
          tx,
          id,
          existingOrderDetails,
          orderDetails,
          existingOrder.status,
          updatedOrder.status,
          `Update Sale #${id}`,
        );

        // 2. Replace existing order details records
        // Fetch variants for prices if needed
        const variantIds = orderDetails.map((d) => d.variantId);
        const variants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, sellingPrice: true, costPrice: true },
        });
        const variantMap = new Map(variants.map((v) => [v.id, v]));

        await tx.orderDetail.deleteMany({
          where: { orderId: id },
        });

        await tx.orderDetail.createMany({
          data: orderDetails.map((detail) => {
            const existing = existingOrderDetails.find(
              (e) =>
                e.productId === detail.productId &&
                e.variantId === detail.variantId,
            );

            let unitPrice = detail.unitPrice;
            if (unitPrice == null) {
              if (existing) {
                unitPrice = existing.unitPrice;
              } else {
                const variant = variantMap.get(detail.variantId);
                if (variant) {
                  unitPrice =
                    Number(variant.sellingPrice) > 0
                      ? variant.sellingPrice
                      : variant.costPrice;
                }
              }
            }

            return {
              orderId: id,
              productId: detail.productId,
              variantId: detail.variantId,
              quantity: detail.quantity,
              unitPrice: unitPrice ?? new Prisma.Decimal(0),
            };
          }),
        });
      } else if (
        updateData.status &&
        updateData.status !== existingOrder.status
      ) {
        // If only status is updated, adjust inventory based on status change
        await adjustInventory(
          tx,
          id,
          existingOrderDetails,
          existingOrderDetails, // Items remain the same, only status changes their effective quantity
          existingOrder.status,
          updateData.status as string,
          `Status change for Sale #${id}`,
        );
      }

      console.log("=== updateSale transaction completed ===");
      return updatedOrder;
    });

    try {
      // Regenerate invoice asynchronously after sale update
      await invoiceService.generateInvoiceFromSale(result.id);
    } catch (error) {
      console.error("Failed to update invoice for updated sale:", error);
    }

    return result;
  },

  deleteSale: async (id: number) => {
    // Note: Deleting a sale should ideally return stock?
    // Let's implement stock return on deletion if it was not already cancelled
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { orderDetail: true },
      });

      if (!order) throw new Error("Order not found");

      // Adjust inventory to return stock if the order was not already cancelled
      // We treat deletion as effectively cancelling the order for inventory purposes
      await adjustInventory(
        tx,
        id,
        order.orderDetail, // Old items are the current order details
        [], // New items are none, as the order is deleted
        order.status,
        "CANCELLED", // Force new status to CANCELLED for inventory calculation
        `Deletion of Sale #${id}`,
      );

      // Delete invoice items first (cascade handle by prisma if set, but let's be sure)
      await tx.invoiceItem.deleteMany({
        where: { invoice: { orderId: id } },
      });

      // Delete invoice
      await tx.invoice.deleteMany({
        where: { orderId: id },
      });

      // Delete order details
      await tx.orderDetail.deleteMany({
        where: { orderId: id },
      });

      // Delete order
      return tx.order.delete({
        where: { id },
      });
    });
  },
} as const;

export type SaleService = typeof saleService;
