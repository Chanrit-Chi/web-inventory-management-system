import { prisma } from "@/lib/prisma";
import {
  Customer,
  CustomerCreate,
  CustomerUpdate,
} from "@/schemas/type-export.schema";

export const customerService = {
  fetchCustomers: async () => {
    return prisma.customer.findMany({
      include: {
        orders: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getCustomerByPhone: async (phone: string): Promise<Customer | null> => {
    return prisma.customer.findFirst({
      where: { phone },
      include: {
        orders: true,
      },
    });
  },

  createCustomer: async (data: CustomerCreate): Promise<Customer> => {
    return prisma.customer.create({
      data,
    });
  },

  getCustomerById: async (id: string): Promise<Customer | null> => {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });
  },

  updateCustomer: async (
    id: string,
    data: CustomerUpdate,
  ): Promise<Customer> => {
    return prisma.customer.update({
      where: { id },
      data,
    });
  },

  deleteCustomer: async (id: string): Promise<Customer> => {
    return prisma.customer.delete({
      where: { id },
    });
  },
} as const;
