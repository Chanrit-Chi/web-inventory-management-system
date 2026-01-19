import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ProductCreateSchema,
  ProductUpdateSchema,
} from "@/schemas/product.schema";
import { ProductWithVariantsSchema } from "@/schemas/complex.schema";
import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductWithVariants,
} from "@/schemas/type-export.schema";

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
    filters?: Record<string, string>
  ) => {
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Add search filter
    if (search && search.trim()) {
      const searchUpper = search.toUpperCase();
      const statusMatch = ["ACTIVE", "INACTIVE"].find((s) =>
        s.includes(searchUpper)
      );

      const orConditions: any[] = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];

      // Add status to search if it matches
      if (statusMatch) {
        orConditions.push({ isActive: statusMatch });
      }

      where.OR = orConditions;
    }

    // Add column filters
    if (filters) {
      if (filters.isActive) {
        where.isActive = filters.isActive;
      }
      if (filters.category) {
        where.categoryId = parseInt(filters.category);
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

  //for bulk create product with variants and attributes--import product with variants schema
  createProductWithVariants: async (
    data: ProductWithVariants
  ): Promise<Product> => {
    const validated = ProductWithVariantsSchema.parse(data);
    const { variants, attributeIds, ...productData } = validated;

    return await prisma.$transaction(async (tx) => {
      // 1. Create the product
      const product = await tx.product.create({
        data: productData,
      });

      // 2. Link product to attributes (ProductOnAttribute)
      if (attributeIds && attributeIds.length > 0) {
        for (const attributeId of attributeIds) {
          await tx.productOnAttribute.create({
            data: {
              productId: product.id,
              attributeId,
            },
          });
        }
      }

      // 3. Create variants with their attributes
      for (const variantData of variants) {
        const { attributes, ...variant } = variantData;

        const createdVariant = await tx.productVariant.create({
          data: {
            ...variant,
            productId: product.id,
          },
        });

        // 4. Link variant to attribute values
        if (attributes && attributes.length > 0) {
          for (const attr of attributes) {
            await tx.productVariantAttribute.create({
              data: {
                variantId: createdVariant.id,
                valueId: attr.valueId,
              },
            });
          }
        }
      }

      // 5. Return the complete product with all relations
      return tx.product.findUnique({
        where: { id: product.id },
        select: selectProductFields,
      }) as Promise<Product>;
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
} as const;
