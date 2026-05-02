import { Prisma, ProductStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ProductUpdateSchema,
  ProductCreateSchema,
} from "@/schemas/product.schema";
import { getServerSession } from "@/lib/getServerSession";
import { hasPermission } from "@/lib/rbac";
import { ensureAccountableVariants } from "@/lib/variant-accountability";

import {
  Product,
  ProductCreate,
  ProductUpdate,
} from "@/schemas/type-export.schema";

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
      barcode: true,
      costPrice: true,
      sellingPrice: true,
      stock: true,
      isActive: true,
      reservedStock: true,
      reorderLevel: true,
      _count: {
        select: {
          orderDetail: true,
        },
      },
      attributes: {
        select: {
          value: {
            select: {
              id: true,
              value: true,
              displayValue: true,
              colorHex: true,
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

const maskCostPriceForSeller = <
  T extends { variants?: Array<Record<string, unknown>> | null },
>(
  product: T | null,
  role?: Role,
): T | null => {
  if (!product || role !== Role.SELLER) return product;

  return {
    ...product,
    variants:
      product.variants?.map((variant) => ({
        ...variant,
        costPrice: null,
      })) ?? [],
  };
};

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
        attributes:
          v.attributes?.map((a) => ({
            valueId: a.value?.id,
            value: a.value
              ? {
                  value: a.value.value,
                  displayValue: a.value.displayValue,
                  colorHex: a.value.colorHex,
                  attribute: { name: a.value.attribute?.name },
                }
              : undefined,
          })) || [],
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
    const session = await getServerSession();
    const currentRole = (session?.user as { role?: Role } | undefined)?.role;

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
          filters.isActive === "true" || filters.isActive === "ACTIVE"
            ? ProductStatus.ACTIVE
            : ProductStatus.INACTIVE;
      }
      const categoryId = Number(filters.category);
      if (Number.isInteger(categoryId)) {
        where.categoryId = categoryId;
      }

      if (filters.stockStatus) {
        if (filters.stockStatus === "low") {
          where.isActive = ProductStatus.ACTIVE;
          where.variants = {
            some: {
              isActive: true,
              stock: { gt: 0, lt: 10 },
            },
          };
        } else if (filters.stockStatus === "out") {
          where.isActive = ProductStatus.ACTIVE;
          where.variants = {
            none: {
              isActive: true,
              stock: { gt: 0 },
            },
            some: {
              isActive: true,
            },
          };
        } else if (filters.stockStatus === "alert") {
          where.isActive = ProductStatus.ACTIVE;
          where.variants = {
            some: {
              isActive: true,
              stock: { lt: 10 },
            },
          };
        }
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && {
            lte: (() => {
              const d = new Date(filters.endDate);
              d.setHours(23, 59, 59, 999);
              return d;
            })(),
          }),
        };
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

    const mappedProducts = products
      .map(mapProductResponse)
      .map((product) => maskCostPriceForSeller(product, currentRole));

    return {
      data: mappedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  fetchProductById: async (id: string) => {
    const session = await getServerSession();
    const currentRole = (session?.user as { role?: Role } | undefined)?.role;

    const result = await prisma.product.findUnique({
      where: { id },
      select: selectProductFields,
    });
    const mappedProduct = mapProductResponse(result);
    return maskCostPriceForSeller(mappedProduct, currentRole);
  },

  createProductWithVariants: async (data: ProductCreate): Promise<Product> => {
    const session = await getServerSession();
    if (
      !session?.user ||
      !hasPermission(session.user.role as Role, "product:create")
    ) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const { productAttributes, variants, supplierId, ...validatedCore } =
      ProductCreateSchema.parse(data);
    const normalizedVariants = ensureAccountableVariants(
      variants,
      validatedCore.sku,
    );

    return await prisma.$transaction(async (tx) => {
      // 1. Create the product
      const product = await tx.product.create({
        data: {
          ...validatedCore,
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
      if (normalizedVariants.length > 0) {
        for (const variant of normalizedVariants) {
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
      return mapProductResponse(result) as unknown as Product;
    });
  },

  updateProduct: async (id: string, data: ProductUpdate): Promise<Product> => {
    const session = await getServerSession();
    if (
      !session?.user ||
      !hasPermission(session.user.role as Role, "product:update")
    ) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

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

      // 3. Update variants (Smart Upsert + Cleanup)
      if (variants) {
        const currentProduct = await tx.product.findUnique({
          where: { id },
          select: { sku: true },
        });

        const normalizedVariants = ensureAccountableVariants(
          variants,
          scalarFields.sku ?? currentProduct?.sku ?? "DEFAULT-SKU",
        );

        const handledIds = new Set<number>();

        for (const variant of normalizedVariants) {
          const { id: variantId, attributes, ...variantData } = variant;

          // Upsert by ID if available, otherwise by SKU to be resilient to lost IDs
          const updatedVariant = await tx.productVariant.upsert({
            where: variantId ? { id: variantId } : { sku: variantData.sku },
            create: {
              ...variantData,
              productId: id,
            },
            update: {
              ...variantData,
              productId: id, // Ensure it's linked to this product even on update
            },
          });

          handledIds.add(updatedVariant.id);

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

        // Delete variants belonging to this product that were not handled above
        const toDeleteVariants = await tx.productVariant.findMany({
          where: {
            productId: id,
            id: { notIn: Array.from(handledIds) },
          },
          select: { id: true },
        });

        const toDeleteIds = toDeleteVariants.map((v) => v.id);

        if (toDeleteIds.length) {
          await tx.productVariantAttribute.deleteMany({
            where: { variantId: { in: toDeleteIds } },
          });
          await tx.productVariant.deleteMany({
            where: { id: { in: toDeleteIds } },
          });
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

      return mapProductResponse(result) as unknown as Product;
    });
  },

  deleteProduct: async (id: string): Promise<Product> => {
    const session = await getServerSession();
    if (
      !session?.user ||
      !hasPermission(session.user.role as Role, "product:delete")
    ) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

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

      return mapProductResponse(deactivated) as unknown as Product;
    });
  },

  reactivateProduct: async (id: string): Promise<Product> => {
    const session = await getServerSession();
    if (
      !session?.user ||
      !hasPermission(session.user.role as Role, "product:update")
    ) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    return await prisma.$transaction(async (tx) => {
      // Reactivate all variants
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { isActive: true },
      });

      // Reactivate the product
      const reactivated = await tx.product.update({
        where: { id },
        data: { isActive: ProductStatus.ACTIVE },
        select: selectProductFields,
      });

      return mapProductResponse(reactivated) as unknown as Product;
    });
  },

  importProducts: async (productsData: Record<string, unknown>[]) => {
    const session = await getServerSession();
    if (
      !session?.user ||
      !hasPermission(session.user.role as Role, "product:create")
    ) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const results = {
      success: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    const normalize = (val: unknown) => val?.toString().trim() || "";

    // 1. Group data by Product SKU
    const productGroups = new Map<string, Record<string, unknown>[]>();
    for (const data of productsData) {
      const pSku = normalize(data.productSku || data.sku); // Fallback to 'sku' if 'productSku' is missing
      if (!pSku) {
        results.failed++;
        results.errors.push("Missing Product SKU for a row");
        continue;
      }
      if (!productGroups.has(pSku)) {
        productGroups.set(pSku, []);
      }
      productGroups.get(pSku)!.push(data);
    }

    // 2. Process each Product Group
    for (const [pSku, rows] of productGroups.entries()) {
      try {
        const firstRow = rows[0];

        await prisma.$transaction(async (tx) => {
          // A. Resolve Category
          const categoryName = normalize(firstRow.category) || "Uncategorized";
          let category = await tx.category.findUnique({
            where: { name: categoryName },
          });
          if (!category) {
            category = await tx.category.create({
              data: { name: categoryName },
            });
          }

          // B. Resolve Unit
          const unitName = normalize(firstRow.unit) || "pcs";
          let unit = await tx.unit.findUnique({ where: { name: unitName } });
          if (!unit) {
            unit = await tx.unit.create({ data: { name: unitName } });
          }

          // C. Upsert Product
          const existingProduct = await tx.product.findUnique({
            where: { sku: pSku },
          });
          let product;
          const productData = {
            name: normalize(firstRow.name) || "Untitled Product",
            description:
              normalize(firstRow.description) || "No description provided",
            categoryId: category.id,
            unitId: unit.id,
          };

          if (existingProduct) {
            product = await tx.product.update({
              where: { id: existingProduct.id },
              data: productData,
            });
            results.updated++;
          } else {
            product = await tx.product.create({
              data: { ...productData, sku: pSku },
            });
            results.success++;
          }

          // D. Process Variants in this group
          for (const row of rows) {
            const vSku = normalize(row.variantSku || row.sku);
            if (!vSku)
              throw new Error(`Missing Variant SKU for product ${pSku}`);

            const variantData = {
              costPrice: new Prisma.Decimal(normalize(row.costPrice) || "0"),
              sellingPrice: new Prisma.Decimal(
                normalize(row.sellingPrice) || "0",
              ),
              stock: Math.max(0, parseInt(normalize(row.stock) || "0")),
              reorderLevel: Math.max(
                0,
                parseInt(normalize(row.reorderLevel) || "0"),
              ),
              isActive: true,
            };

            const variant = await tx.productVariant.upsert({
              where: { sku: vSku },
              update: variantData,
              create: { ...variantData, productId: product.id, sku: vSku },
            });

            // E. Process Attributes (e.g., attr1Name/attr1Value, attr2Name/attr2Value)
            for (let i = 1; i <= 3; i++) {
              const attrName = normalize(row[`attr${i}Name`]);
              const attrVal = normalize(row[`attr${i}Value`]);

              if (attrName && attrVal) {
                // Resolve Attribute
                let attribute = await tx.productAttribute.findUnique({
                  where: { name: attrName.toLowerCase() },
                });
                if (!attribute) {
                  attribute = await tx.productAttribute.create({
                    data: {
                      name: attrName.toLowerCase(),
                      displayName: attrName,
                    },
                  });
                }

                // Ensure Product linked to Attribute
                await tx.productOnAttribute.upsert({
                  where: {
                    productId_attributeId: {
                      productId: product.id,
                      attributeId: attribute.id,
                    },
                  },
                  update: {},
                  create: { productId: product.id, attributeId: attribute.id },
                });

                // Resolve Attribute Value
                let value = await tx.productAttributeValue.findUnique({
                  where: {
                    attributeId_value: {
                      attributeId: attribute.id,
                      value: attrVal.toLowerCase(),
                    },
                  },
                });
                if (!value) {
                  value = await tx.productAttributeValue.create({
                    data: {
                      attributeId: attribute.id,
                      value: attrVal.toLowerCase(),
                      displayValue: attrVal,
                    },
                  });
                }

                // Link Variant to Attribute Value
                await tx.productVariantAttribute.upsert({
                  where: {
                    variantId_valueId: {
                      variantId: variant.id,
                      valueId: value.id,
                    },
                  },
                  update: {},
                  create: { variantId: variant.id, valueId: value.id },
                });
              }
            }
          }
        });
      } catch (error: unknown) {
        results.failed++;
        const message = error instanceof Error ? error.message : String(error);
        results.errors.push(`Product SKU ${pSku}: ${message}`);
      }
    }

    return results;
  },
} as const;
