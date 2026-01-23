import { Prisma, ProductVariant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ProductVariantCreateInput } from "@/schemas/type-export.schema";
import { ProductVariantCreateInputSchema } from "@/schemas/product-variant.schema";
import { VariantCreateCommand } from "@/schemas/commands/variant-create.command";

type VariantFilters = {
  productId?: string;
  lowStock?: boolean;
  searchSku?: string;
};

const buildVariantWhere = (
  filters?: VariantFilters,
): Prisma.ProductVariantWhereInput => {
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

  return where;
};

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
    command: VariantCreateCommand,
  ): Promise<ProductVariant> => {
    const { attributes, ...variantData } = command;

    return prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: variantData,
      });

      if (attributes?.length) {
        await tx.productVariantAttribute.createMany({
          data: attributes.map((attr) => ({
            variantId: variant.id,
            valueId: attr.valueId,
          })),
        });
      }

      return tx.productVariant.findUniqueOrThrow({
        where: { id: variant.id },
        select: selectVariantDetailFields,
      });
    });
  },

  fetchVariants: async (
    page: number = 1,
    limit: number = 10,
    filters?: VariantFilters,
  ) => {
    const skip = (page - 1) * limit;
    const where = buildVariantWhere(filters);

    const [data, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        select: selectVariantListFields,
        orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
        take: limit,
        skip,
      }),
      prisma.productVariant.count({ where }),
    ]);

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

  fetchVariantById: async (id: number): Promise<ProductVariant | null> => {
    return prisma.productVariant.findUnique({
      where: { id },
      select: selectVariantDetailFields,
    });
  },

  fetchVariantBySku: async (sku: string): Promise<ProductVariant | null> => {
    return prisma.productVariant.findUnique({
      where: { sku },
      select: selectVariantDetailFields,
    });
  },

  fetchVariantsByProduct: async (
    productId: string,
  ): Promise<ProductVariant[]> => {
    return prisma.productVariant.findMany({
      where: { productId },
      select: selectVariantListFields,
    });
  },

  countVariants: async (filters?: VariantFilters): Promise<number> => {
    return prisma.productVariant.count({
      where: buildVariantWhere(filters),
    });
  },
} as const;
