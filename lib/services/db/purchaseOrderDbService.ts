import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PurchaseOrderWithDetails } from "@/schemas/type-export.schema";

const purchaseOrderSelectFields = {
  id: true,
  supplierId: true,
  status: true,
  totalAmount: true,
  createdAt: true,
  updatedAt: true,
  supplier: {
    select: { id: true, name: true, email: true, phone: true },
  },
  purchaseOrderDetails: {
    select: {
      id: true,
      productId: true,
      variantId: true,
      quantity: true,
      unitPrice: true,
      product: { select: { name: true, sku: true, image: true } },
      variant: {
        select: {
          id: true,
          sku: true,
          stock: true,
          attributes: {
            include: {
              value: { include: { attribute: true } },
            },
          },
        },
      },
    },
  },
};

interface AdjustInventoryOptions {
  oldItems: { variantId: number; quantity: number }[];
  newItems: { variantId: number; quantity: number }[];
  oldStatus: string;
  newStatus: string;
  reason: string;
  createdBy?: string;
}

/**
 * Adjust inventory for purchase order operations.
 * For purchases: receiving stock INCREASES inventory (opposite of sales).
 */
async function adjustPurchaseInventory(
  tx: Prisma.TransactionClient,
  purchaseOrderId: number,
  options: AdjustInventoryOptions,
) {
  const { oldItems, newItems, oldStatus, newStatus, reason, createdBy } =
    options;
  const isOldCancelled = oldStatus === "CANCELLED";
  const isNewCancelled = newStatus === "CANCELLED";
  const isOldPending = oldStatus === "PENDING";
  const isNewPending = newStatus === "PENDING";

  // Effective qty that was actually in stock before this update
  const existingQtyMap = new Map<number, number>();
  oldItems.forEach((d) => {
    // Only COMPLETED orders have stock; PENDING/CANCELLED don't
    const qty = isOldCancelled || isOldPending ? 0 : d.quantity;
    existingQtyMap.set(
      d.variantId,
      (existingQtyMap.get(d.variantId) || 0) + qty,
    );
  });

  // Effective qty that should be in stock after this update
  const newQtyMap = new Map<number, number>();
  newItems.forEach((d) => {
    const qty = isNewCancelled || isNewPending ? 0 : d.quantity;
    newQtyMap.set(d.variantId, (newQtyMap.get(d.variantId) || 0) + qty);
  });

  const allVariantIds = Array.from(
    new Set([...existingQtyMap.keys(), ...newQtyMap.keys()]),
  );

  for (const vId of allVariantIds) {
    const oldQty = existingQtyMap.get(vId) || 0;
    const newQty = newQtyMap.get(vId) || 0;
    const delta = newQty - oldQty; // positive = add stock, negative = remove stock

    if (delta !== 0) {
      const variant = await tx.productVariant.findUnique({
        where: { id: vId },
        select: { stock: true },
      });

      if (!variant) {
        throw new Error(`Product variant with ID ${vId} not found`);
      }

      const previousStock = variant.stock;
      const updatedStock = previousStock + delta;

      if (updatedStock < 0) {
        throw new Error(
          `Cannot reduce stock below 0 for variant ID ${vId}. Current: ${previousStock}, Adjustment: ${delta}`,
        );
      }

      await tx.productVariant.update({
        where: { id: vId },
        data: { stock: updatedStock },
      });

      await tx.stockMovement.create({
        data: {
          variantId: vId,
          movementType: delta > 0 ? "PURCHASE" : "RETURN",
          quantity: delta,
          previousStock,
          newStock: updatedStock,
          purchaseOrderId,
          reason,
          createdBy,
        },
      });
    }
  }
}

export const purchaseOrderService = {
  fetchPurchaseOrders: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: { status?: string; supplierId?: string },
  ) => {
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      ...(search && {
        OR: [
          ...(Number.isNaN(Number(search)) ? [] : [{ id: Number(search) }]),
          { supplier: { name: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...(filters?.status && {
        status: filters.status as Prisma.EnumorderStatusFilter,
      }),
      ...(filters?.supplierId && { supplierId: filters.supplierId }),
    };

    const [total, data] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        select: purchaseOrderSelectFields,
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

  getPurchaseOrderById: async (id: number) => {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      select: purchaseOrderSelectFields,
    });
  },

  createPurchaseOrder: async (
    data: PurchaseOrderWithDetails,
    createdBy?: string,
  ) => {
    return prisma.$transaction(async (tx) => {
      const { purchaseOrderDetails, ...orderData } = data;

      const totalAmount = purchaseOrderDetails.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );

      const order = await tx.purchaseOrder.create({
        data: {
          ...orderData,
          totalAmount,
        },
      });

      await tx.purchaseOrderDetail.createMany({
        data: purchaseOrderDetails.map((detail) => ({
          purchaseOrderId: order.id,
          productId: detail.productId,
          variantId: detail.variantId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
        })),
      });

      // Adjust inventory if order is COMPLETED
      await adjustPurchaseInventory(tx, order.id, {
        oldItems: [],
        newItems: purchaseOrderDetails,
        oldStatus: "PENDING", // treating initial as no-stock state
        newStatus: orderData.status || "COMPLETED",
        reason: `Purchase Order #${order.id}`,
        createdBy,
      });

      return order;
    });
  },

  updatePurchaseOrder: async (
    id: number,
    data: Partial<PurchaseOrderWithDetails>,
    createdBy?: string,
  ) => {
    return prisma.$transaction(async (tx) => {
      const existingOrder = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { purchaseOrderDetails: true },
      });

      if (!existingOrder) throw new Error("Purchase order not found");

      const { purchaseOrderDetails, ...updateData } = data;

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: updateData as Prisma.PurchaseOrderUpdateInput,
      });

      if (purchaseOrderDetails && Array.isArray(purchaseOrderDetails)) {
        await adjustPurchaseInventory(tx, id, {
          oldItems: existingOrder.purchaseOrderDetails,
          newItems: purchaseOrderDetails,
          oldStatus: existingOrder.status,
          newStatus: updatedOrder.status,
          reason: `Update Purchase Order #${id}`,
          createdBy,
        });

        const newTotal = purchaseOrderDetails.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        );

        await tx.purchaseOrderDetail.deleteMany({
          where: { purchaseOrderId: id },
        });

        await tx.purchaseOrderDetail.createMany({
          data: purchaseOrderDetails.map((detail) => ({
            purchaseOrderId: id,
            productId: detail.productId,
            variantId: detail.variantId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
          })),
        });

        await tx.purchaseOrder.update({
          where: { id },
          data: { totalAmount: newTotal },
        });
      } else if (
        updateData.status &&
        updateData.status !== existingOrder.status
      ) {
        await adjustPurchaseInventory(tx, id, {
          oldItems: existingOrder.purchaseOrderDetails,
          newItems: existingOrder.purchaseOrderDetails,
          oldStatus: existingOrder.status,
          newStatus: updateData.status as string,
          reason: `Status change for Purchase Order #${id}`,
          createdBy,
        });
      }

      return updatedOrder;
    });
  },

  deletePurchaseOrder: async (id: number, createdBy?: string) => {
    return prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { purchaseOrderDetails: true },
      });

      if (!order) throw new Error("Purchase order not found");

      // Return stock if order was COMPLETED
      await adjustPurchaseInventory(tx, id, {
        oldItems: order.purchaseOrderDetails,
        newItems: [],
        oldStatus: order.status,
        newStatus: "CANCELLED",
        reason: `Deletion of Purchase Order #${id}`,
        createdBy,
      });

      await tx.purchaseOrderDetail.deleteMany({
        where: { purchaseOrderId: id },
      });

      return tx.purchaseOrder.delete({ where: { id } });
    });
  },
} as const;
