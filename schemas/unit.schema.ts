import z from "zod";

export const UnitSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Unit name is required"),
  description: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export const UnitCreateSchema = UnitSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UnitUpdateSchema = UnitCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be updated",
  },
);
