import { prisma } from "@/lib/prisma";
import { Product, ProductVariantCreate } from "@/schemas/type-export.schema";

export const productService = {
  fetchProducts: async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    return prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        image: true,
        description: true,
        costPrice: true,
        sellingPrice: true,
        unit: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: { id: true, name: true },
        },
        supplier: {
          select: { id: true, name: true },
        },
        variants: {
          select: {
            id: true,
            stock: true,
            reservedStock: true,
            reorderLevel: true,
            attributes: {
              select: {
                id: true,
                value: true,
                attribute: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
    });
  },

  createProduct: async (
    data: Omit<
      Product,
      "variants" | "orderDetail" | "purchaseOrderDetails" | "supplier"
    >
  ) => {
    return prisma.product.create({ data });
  },

  // Add separate functions for variants/attributes as before
  createVariant: async (data: ProductVariantCreate) => {
    return prisma.productVariant.create({ data });
  },
};
