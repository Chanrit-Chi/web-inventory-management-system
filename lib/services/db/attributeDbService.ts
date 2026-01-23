import { prisma } from "@/lib/prisma";

export const attributeDbService = {
  async fetchAttributes() {
    return prisma.productAttribute.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
};
