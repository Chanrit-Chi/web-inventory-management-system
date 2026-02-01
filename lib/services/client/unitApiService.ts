import { Unit, UnitCreate, UnitUpdate } from "@/schemas/type-export.schema";
import { UnitCreateSchema, UnitUpdateSchema } from "@/schemas/unit.schema";

export const unitApiService = {
  fetchUnits: async (): Promise<Unit[]> => {
    const res = await fetch("/api/products/units");
    if (!res.ok) {
      throw new Error("Failed to fetch units");
    }
    return res.json();
  },

  fetchUnitById: async (id: number): Promise<Unit> => {
    const res = await fetch(`/api/products/units/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch unit");
    }
    return res.json();
  },

  addUnit: async (data: UnitCreate): Promise<Unit> => {
    const validate = UnitCreateSchema.parse(data);
    const res = await fetch("/api/products/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validate),
    });
    if (!res.ok) {
      throw new Error("Failed to add unit");
    }
    return res.json();
  },

  updateUnit: async (id: number, data: UnitUpdate): Promise<Unit> => {
    const validate = UnitUpdateSchema.parse(data);
    const res = await fetch(`/api/products/units/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validate),
    });
    if (!res.ok) {
      throw new Error("Failed to update unit");
    }
    return res.json();
  },

  deleteUnit: async (id: number): Promise<void> => {
    const res = await fetch(`/api/products/units/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete unit");
    }
  },
};
