import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ProductUpdateSchema,
  ProductCreateSchema,
} from "@/schemas/product.schema";

import {
  Product,
  ProductCreate,
  ProductUpdate,
} from "@/schemas/type-export.schema";
import { AttributeSelection } from "@/utils/cartesianProduct";

const selectProductFields = {
  id: true,
  sku: true,
  name: true,
  image: true,
  description: true,
  unitId: true,
  unit: {
    select: { id: true, name: true },
  },
  categoryId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  variants: {
    select: {
      id: true,
      productId: true,
      sku: true,
      costPrice: true,
      sellingPrice: true,
      stock: true,
      isActive: true,
      reservedStock: true,
      reorderLevel: true,
      attributes: {
        select: {
          value: {
            select: {
              id: true,
              value: true,
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
    },
  },
  productAttributes: {
    select: {
      attribute: {
        select: {
          id: true,
          name: true,
          values: {
            select: {
              id: true,
              value: true,
            },
          },
        },
      },
    },
  },
  category: {
    select: { id: true, name: true },
  },
  supplier: {
    select: { id: true, name: true },
  },
} satisfies Prisma.ProductSelect;

type ProductWithRelations = Prisma.ProductGetPayload<{
  select: typeof selectProductFields;
}>;

const mapProductResponse = (result: ProductWithRelations | null) => {
  if (!result) return null;

  // 1. Extract used value IDs from all variants
  const usedValueIds = new Set<number>();
  result.variants?.forEach((v) => {
    v.attributes?.forEach((attr) => {
      if (attr.value?.id) usedValueIds.add(attr.value.id);
    });
  });

  // 2. Reconstruct attributeSelections based on productAttributes and used values
  const attributeSelections =
    result.productAttributes?.map((pa) => {
      const attr = pa.attribute;
      const valuesForThisAttr =
        attr.values?.filter((v) => usedValueIds.has(v.id)) || [];

      return {
        attributeId: attr.id,
        attributeName: attr.name,
        selectedValueIds: valuesForThisAttr.map((v) => v.id),
        values: valuesForThisAttr,
      };
    }) || [];

  return {
    ...result,
    attributeSelections,
    productAttributes:
      result.productAttributes?.map((pa) => pa.attribute?.id) || [],
    variants:
      result.variants?.map((v) => ({
        ...v,
        attributes: v.attributes?.map((a) => ({ valueId: a.value?.id })) || [],
      })) || [],
    unit: result.unit?.name || null,
  };
};

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
      const searchUpper = search.toUpperCase();
      const orConditions: Prisma.ProductWhereInput[] = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];

      // Add status to search if it matches
      const statusMap: Record<string, ProductStatus> = {
        ACTIVE: ProductStatus.ACTIVE,
        INACTIVE: ProductStatus.INACTIVE,
      };

      const status = statusMap[searchUpper];
      if (status) {
        orConditions.push({ isActive: status });
      }

      where.OR = orConditions;
    }

    // Add column filters
    if (filters) {
      if (filters.isActive) {
        where.isActive =
          filters.isActive === "ACTIVE"
            ? ProductStatus.ACTIVE
            : ProductStatus.INACTIVE;
      }
      const categoryId = Number(filters.category);
      if (Number.isInteger(categoryId)) {
        where.categoryId = categoryId;
      }
    }

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
      data: products.map(mapProductResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  fetchProductById: async (id: string) => {
    const result = await prisma.product.findUnique({
      where: { id },
      select: selectProductFields,
    });
    return mapProductResponse(result);
  },

  createProductWithVariants: async (
    data: ProductCreate,
    attributeSelections: AttributeSelection[],
  ): Promise<Product> => {
    const validated = ProductCreateSchema.parse(data);
    const { productAttributes, variants, supplierId, ...validatedCore } =
      validated;
    const coreProductData = validatedCore;

    return await prisma.$transaction(async (tx) => {
      // 1. Create the product
      const product = await tx.product.create({
        data: {
          ...coreProductData,
          ...(supplierId && supplierId.length > 0
            ? {
                supplier: {
                  connect: supplierId.map((id) => ({ id: String(id) })),
                },
              }
            : {}),
        },
      });

      // 2. Link product to attributes (ProductOnAttribute)
      if (productAttributes && productAttributes.length > 0) {
        for (const attributeId of productAttributes) {
          await tx.productOnAttribute.createMany({
            data: {
              productId: product.id,
              attributeId,
            },
          });
        }
      }

      // 3. Create variants from frontend data
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          const { attributes, ...variantData } = variant;
          // Remove ID and ProductID if existing to avoid passing them to create
          delete (variantData as { id?: number }).id;
          delete (variantData as { productId?: string }).productId;

          const createdVariant = await tx.productVariant.create({
            data: {
              ...variantData,
              productId: product.id,
              isActive: true,
            },
          });

          // 4. Link variant to attribute values
          if (attributes && attributes.length > 0) {
            await tx.productVariantAttribute.createMany({
              data: attributes.map((attr) => ({
                variantId: createdVariant.id,
                valueId: attr.valueId,
              })),
            });
          }
        }
      }

      // 5. Return the complete product with all relations
      const result = await tx.product.findUnique({
        where: { id: product.id },
        select: selectProductFields,
      });
      if (!result) throw new Error("Product not found");
      return mapProductResponse(result) as Product;
    });
  },

  updateProduct: async (id: string, data: ProductUpdate): Promise<Product> => {
    const validated = ProductUpdateSchema.parse(data);

    const { productAttributes, variants, supplierId, ...scalarFields } =
      validated;

    return prisma.$transaction(async (tx) => {
      // 1. Update scalar fields only
      await tx.product.update({
        where: { id },
        data: scalarFields,
      });

      // 2. Update product attributes (diff-based)
      if (productAttributes) {
        const existing = await tx.productOnAttribute.findMany({
          where: { productId: id },
          select: { attributeId: true },
        });

        const existingIds = new Set(existing.map((e) => e.attributeId));
        const incomingIds = new Set(productAttributes);

        const toAdd = productAttributes.filter((id) => !existingIds.has(id));
        const toRemove = [...existingIds].filter((id) => !incomingIds.has(id));

        if (toAdd.length) {
          await tx.productOnAttribute.createMany({
            data: toAdd.map((attributeId) => ({
              productId: id,
              attributeId,
            })),
          });
        }

        if (toRemove.length) {
          await tx.productOnAttribute.deleteMany({
            where: {
              productId: id,
              attributeId: { in: toRemove },
            },
          });
        }
      }

      // 3. Update variants (upsert + delete missing)
      if (variants) {
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id },
          select: { id: true },
        });

        const existingIds = new Set(existingVariants.map((v) => v.id));
        const incomingIds = new Set(variants.map((v) => v.id));

        // Delete removed variants
        const toDelete = [...existingIds].filter(
          (vid) => !incomingIds.has(vid),
        );
        if (toDelete.length) {
          await tx.productVariant.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert variants
        for (const variant of variants) {
          const { id: variantId, attributes, ...variantData } = variant;

          const updatedVariant = await tx.productVariant.upsert({
            where: { id: variantId },
            create: {
              ...variantData,
              productId: id,
            },
            update: variantData,
          });

          // Variant attributes (replace safely)
          if (attributes) {
            await tx.productVariantAttribute.deleteMany({
              where: { variantId: updatedVariant.id },
            });

            await tx.productVariantAttribute.createMany({
              data: attributes.map((attr) => ({
                variantId: updatedVariant.id,
                valueId: attr.valueId,
              })),
            });
          }
        }
      }

      // 4. Supplier relation (connect/disconnect)
      if (supplierId) {
        await tx.product.update({
          where: { id },
          data: {
            supplier: {
              set: supplierId.map((sid) => ({ id: String(sid) })),
            },
          },
        });
      }

      // 5. Return fully hydrated product
      const result = await tx.product.findUnique({
        where: { id },
        select: selectProductFields,
      });

      if (!result) throw new Error("Product not found");

      return mapProductResponse(result) as Product;
    });
  },

  deleteProduct: async (id: string): Promise<Product> => {
    return await prisma.$transaction(async (tx) => {
      // Deactivate all variants
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { isActive: false },
      });

      // Deactivate the product
      const deactivated = await tx.product.update({
        where: { id },
        data: { isActive: ProductStatus.INACTIVE },
        select: selectProductFields,
      });

      return mapProductResponse(deactivated) as Product;
    });
  },
} as const;
