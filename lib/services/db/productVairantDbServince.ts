import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductVariantWithAttributesSchema } from "@/schemas/complex.schema";
import {
  ProductVariant,
  ProductVariantCreate,
} from "@/schemas/type-export.schema";

// Minimal fields for list views (faster, smaller payload)
const selectVariantListFields = {
  id: true,
  productId: true, // Required by type
  sku: true,
  costPrice: true, // Required by type
  sellingPrice: true,
  stock: true,
  reservedStock: true,
  reorderLevel: true, // Required by type
  product: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  attributes: {
    select: {
      value: {
        select: {
          value: true,
          attribute: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductVariantSelect;

// Full fields for detail views (complete data)
const selectVariantDetailFields = {
  id: true,
  productId: true,
  sku: true,
  costPrice: true,
  sellingPrice: true,
  stock: true,
  reservedStock: true,
  reorderLevel: true,
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      image: true,
      description: true,
      unit: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  attributes: {
    select: {
      id: true,
      variantId: true,
      valueId: true,
      value: {
        select: {
          id: true,
          value: true,
          attributeId: true,
          attribute: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductVariantSelect;

export const ProductVariantDbService = {
  // Add separate functions for variants/attributes
  createVariant: async (
    data: ProductVariantCreate
  ): Promise<ProductVariant> => {
    const validateProductVariant =
      ProductVariantWithAttributesSchema.parse(data);
    const { attributes, ...variantData } = validateProductVariant;

    // Pre-validate attribute values BEFORE transaction (reduces ID gaps)
    if (attributes && Array.isArray(attributes) && attributes.length > 0) {
      for (const attr of attributes) {
        const attributeValue = await prisma.productAttributeValue.findUnique({
          where: { id: attr.valueId },
        });

        if (!attributeValue) {
          throw new Error(
            `Attribute value with ID ${attr.valueId} does not exist`
          );
        }
      }
    }

    return (await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: variantData,
      });

      // Link variant to attribute values (already validated)
      if (attributes && Array.isArray(attributes) && attributes.length > 0) {
        for (const attr of attributes) {
          await tx.productVariantAttribute.create({
            data: {
              variantId: variant.id,
              valueId: attr.valueId,
            },
          });
        }
      }

      // Return the variant with attributes
      return tx.productVariant.findUnique({
        where: { id: variant.id },
        select: selectVariantDetailFields,
      });
    })) as ProductVariant;
  },

  fetchVariant: async (
    page: number = 1,
    limit: number = 10,
    filters?: {
      productId?: string;
      lowStock?: boolean; // stock <= reorderLevel
      searchSku?: string;
    }
  ): Promise<ProductVariant[]> => {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductVariantWhereInput = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.searchSku) {
      where.sku = {
        contains: filters.searchSku,
        mode: "insensitive",
      };
    }

    if (filters?.lowStock) {
      where.stock = {
        lte: prisma.productVariant.fields.reorderLevel,
      };
    }

    return await prisma.productVariant.findMany({
      where,
      select: selectVariantListFields,
      orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
      take: limit,
      skip: skip,
    });
  },

  fetchVariantById: async (id: number): Promise<ProductVariant | null> => {
    return await prisma.productVariant.findUnique({
      where: { id },
      select: selectVariantDetailFields,
    });
  },

  fetchVariantsBySku: async (sku: string): Promise<ProductVariant | null> => {
    return await prisma.productVariant.findUnique({
      where: { sku },
      select: selectVariantDetailFields,
    });
  },

  fetchVariantsByProduct: async (
    productId: string
  ): Promise<ProductVariant[]> => {
    return await prisma.productVariant.findMany({
      where: { productId },
      select: selectVariantListFields,
    });
  },

  countVariants: async (filters?: {
    productId?: string;
    lowStock?: boolean;
  }): Promise<number> => {
    const where: Prisma.ProductVariantWhereInput = {};

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.lowStock) {
      where.stock = {
        lte: prisma.productVariant.fields.reorderLevel,
      };
    }

    return await prisma.productVariant.count({ where });
  },
} as const;
