import { prisma } from "@/lib/prisma";

export const paymentMethodDbService = {
  async getAll() {
    return await prisma.paymentMethod.findMany({
      orderBy: { name: "asc" },
    });
  },

  async create(name: string) {
    return await prisma.paymentMethod.create({
      data: { name },
    });
  },

  async update(id: number, name: string) {
    return await prisma.paymentMethod.update({
      where: { id },
      data: { name },
    });
  },

  async delete(id: number) {
    return await prisma.paymentMethod.delete({
      where: { id },
    });
  },
};
