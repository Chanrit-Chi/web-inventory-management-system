import { prisma } from "@/lib/prisma";
import { Unit, UnitCreate, UnitUpdate } from "@/schemas/type-export.schema";

export const UnitDbService = {
  fetchUnits: async (): Promise<Unit[]> => {
    return prisma.unit.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  fetchUnitById: async (id: number): Promise<Unit | null> => {
    return prisma.unit.findUnique({
      where: { id },
    });
  },

  createUnit: async (data: UnitCreate): Promise<Unit> => {
    return prisma.unit.create({
      data,
    });
  },

  updateUnit: async (id: number, data: UnitUpdate): Promise<Unit> => {
    return prisma.unit.update({
      where: { id },
      data,
    });
  },

  deleteUnit: async (id: number): Promise<Unit> => {
    return prisma.unit.delete({
      where: { id },
    });
  },
} as const;
