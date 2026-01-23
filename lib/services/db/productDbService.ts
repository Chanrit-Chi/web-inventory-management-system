import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ProductCreateSchema,
  ProductUpdateSchema,
} from "@/schemas/product.schema";
import {
  Product,
  ProductCreate,
  ProductUpdate,
} from "@/schemas/type-export.schema";
import { ProductCreateUtils } from "@/utils/productCreate";
import { ProductWithVariantsCommand } from "@/schemas/commands/product-with-variants.command";

const selectProductFields = {
  id: true,
  sku: true,
  name: true,
  image: true,
  description: true,
  unit: true,
  categoryId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    select: {
      id: true,
      sku: true,
      costPrice: true,
      sellingPrice: true,
      stock: true,
      reservedStock: true,
      reorderLevel: true,
      attributes: {
        select: { id: true },
      },
    },
  },
  productAttributes: {
    select: { productId: true, attributeId: true },
  },
  category: {
    select: { id: true, name: true },
  },
  supplier: {
    select: { id: true, name: true },
  },
} satisfies Prisma.ProductSelect;

export const productDbService = {
  fetchProducts: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters?: Record<string, string>,
  ) => {
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: Prisma.ProductWhereInput = {};

    // Add search filter
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Add column filters
    if (filters?.isActive !== undefined) {
      if (filters.isActive === "true") where.isActive = "ACTIVE";
      else if (filters.isActive === "false") where.isActive = "INACTIVE";
    }
    if (filters?.category) where.categoryId = Number(filters.category);

    console.log("Product search query:", search);
    console.log("Product filters:", filters);
    console.log("Product where clause:", JSON.stringify(where, null, 2));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: selectProductFields,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  fetchProductById: async (id: string) => {
    return prisma.product.findUnique({
      where: { id },
      select: selectProductFields,
    });
  },

  createProduct: async (data: ProductCreate): Promise<Product> => {
    const validateProduct = ProductCreateSchema.parse(data);
    return prisma.product.create({
      data: validateProduct,
      select: selectProductFields,
    });
  },

  createProductWithVariants: async (
    command: ProductWithVariantsCommand,
  ): Promise<Product> => {
    const { variants, attributeIds, ...productData } = command;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productData,
      });

      if (attributeIds?.length) {
        await tx.productOnAttribute.createMany({
          data: attributeIds.map((attributeId) => ({
            productId: product.id,
            attributeId,
          })),
        });
      }

      for (const variant of variants) {
        const { attributes, ...variantData } = variant;

        const createdVariant = await tx.productVariant.create({
          data: {
            ...variantData,
            productId: product.id,
          },
        });

        if (attributes?.length) {
          await tx.productVariantAttribute.createMany({
            data: attributes.map((attr) => ({
              variantId: createdVariant.id,
              valueId: attr.valueId,
            })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        select: selectProductFields,
      });
    });
  },

  updateProduct: async (id: string, data: ProductUpdate): Promise<Product> => {
    const validateProduct = ProductUpdateSchema.parse(data);
    return await prisma.product.update({
      where: { id },
      data: validateProduct,
    });
  },

  deleteProduct: async (id: string): Promise<Product> => {
    return prisma.product.delete({
      where: { id },
    });
  },

  assignAttributeToProduct: async (
    productId: string,
    attributeIds: number[],
  ): Promise<void> => {
    if (attributeIds.length === 0) return;
    await prisma.$transaction(async (tx) => {
      await tx.productOnAttribute.deleteMany({
        where: { productId },
      });

      for (const attributeId of attributeIds) {
        await tx.productOnAttribute.create({
          data: {
            productId,
            attributeId,
          },
        });
      }
    });
  },

  generateVariantsForProduct: async (
    productId: string,
    attributeValueMap: Record<number, number[]>,
  ): Promise<void> => {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch allowed attributes
      const productAttributes = await tx.productOnAttribute.findMany({
        where: { productId },
        include: {
          attribute: {
            include: { values: true },
          },
        },
      });

      if (!productAttributes.length) {
        throw new Error("Product has no attributes assigned");
      }

      // 2. Build value sets (validated)
      const valueSets = productAttributes.map((pa) => {
        const allowedValues = attributeValueMap[pa.attributeId] ?? [];

        if (!allowedValues.length) {
          throw new Error(
            `No values provided for attribute ${pa.attribute.name}`,
          );
        }

        return pa.attribute.values.filter((v) => allowedValues.includes(v.id));
      });

      // 3. Generate combinations
      const combinations = ProductCreateUtils.cartesian(valueSets);

      // 4. Create variants deterministically
      for (const values of combinations) {
        const exists = await tx.productVariant.findFirst({
          where: {
            productId,
            attributes: {
              every: {
                valueId: { in: values.map((v) => v.id) },
              },
            },
          },
        });

        if (exists) continue;

        const skuSuffix = values
          .map((v) => v.value)
          .join("-")
          .toUpperCase();

        await tx.productVariant.create({
          data: {
            productId,
            sku: `${productId}-${skuSuffix}`,
            attributes: {
              create: values.map((v) => ({
                valueId: v.id,
              })),
            },
          },
        });
      }
    });
  },
} as const;
