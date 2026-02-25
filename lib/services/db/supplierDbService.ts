import { prisma } from "@/lib/prisma";
import {
  Supplier,
  SupplierCreate,
  SupplierUpdate,
} from "@/schemas/type-export.schema";
import { Prisma } from "@prisma/client";

export const supplierService = {
  fetchSuppliers: async (
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) => {
    const skip = (page - 1) * limit;

    const where: Prisma.SupplierWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: { purchaseOrders: true, products: true },
          },
        },
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

  getSupplierById: async (id: string): Promise<Supplier | null> => {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: { purchaseOrders: true, products: true },
        },
      },
    });
  },

  getAllSuppliers: async () => {
    return prisma.supplier.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  },

  createSupplier: async (data: SupplierCreate): Promise<Supplier> => {
    return prisma.supplier.create({ data });
  },

  updateSupplier: async (
    id: string,
    data: SupplierUpdate,
  ): Promise<Supplier> => {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  },

  deleteSupplier: async (id: string): Promise<Supplier> => {
    return prisma.supplier.delete({ where: { id } });
  },
} as const;
