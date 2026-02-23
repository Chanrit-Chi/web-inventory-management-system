import { prisma } from "@/lib/prisma";
import { StockMovementType, Prisma } from "@prisma/client";

export const stockService = {
  /**
   * Adjusts stock for a specific product variant and records the movement.
   */
  adjustStock: async (params: {
    variantId: number;
    movementType: StockMovementType;
    quantity: number; // The amount to change by (can be negative for reduction)
    reason?: string;
    createdBy?: string;
  }) => {
    const { variantId, movementType, quantity, reason, createdBy } = params;

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current variant to get balance and ensure existence
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, stock: true },
      });

      if (!variant) {
        throw new Error(`Product variant with ID ${variantId} not found`);
      }

      const previousStock = variant.stock;
      const newStock = previousStock + quantity;

      if (newStock < 0) {
        throw new Error(
          `Insufficient stock. Current: ${previousStock}, Requested adjustment: ${quantity}`,
        );
      }

      // 2. Update the variant's stock
      const updatedVariant = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stock: newStock,
        },
      });

      // 3. Record the stock movement
      const movement = await tx.stockMovement.create({
        data: {
          variantId,
          movementType,
          quantity,
          previousStock,
          newStock,
          reason,
          createdBy,
        },
      });

      return {
        variant: updatedVariant,
        movement,
      };
    });
  },

  /**
   * Adjusts stock for multiple variants in a single transaction.
   */
  batchAdjustStock: async (
    adjustments: Array<{
      variantId: number;
      movementType: StockMovementType;
      quantity: number;
      reason?: string;
      createdBy?: string;
    }>,
  ) => {
    return await prisma.$transaction(async (tx) => {
      const results = [];

      for (const adj of adjustments) {
        const { variantId, movementType, quantity, reason, createdBy } = adj;

        // 1. Fetch current variant
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { id: true, stock: true },
        });

        if (!variant) {
          throw new Error(`Product variant with ID ${variantId} not found`);
        }

        const previousStock = variant.stock;
        const newStock = previousStock + quantity;

        if (newStock < 0) {
          throw new Error(
            `Insufficient stock for variant ${variantId}. Current: ${previousStock}, Adjustment: ${quantity}`,
          );
        }

        // 2. Update stock
        const updatedVariant = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: newStock },
        });

        // 3. Record movement
        const movement = await tx.stockMovement.create({
          data: {
            variantId,
            movementType,
            quantity,
            previousStock,
            newStock,
            reason,
            createdBy,
          },
        });

        results.push({ variant: updatedVariant, movement });
      }

      return results;
    });
  },

  /**
   * Fetches stock movements with pagination and filtering.
   */
  fetchStockMovements: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    movementType?: StockMovementType;
    variantId?: number;
  }) => {
    const { page = 1, pageSize = 10, search, movementType, variantId } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.StockMovementWhereInput = {
      ...(movementType && { movementType }),
      ...(variantId && { variantId }),
      ...(search && {
        OR: [
          { variant: { sku: { contains: search, mode: "insensitive" } } },
          {
            variant: {
              product: { name: { contains: search, mode: "insensitive" } },
            },
          },
          { reason: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        include: {
          variant: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
};
