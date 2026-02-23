import { z } from "zod";
import { cuidSchema } from "./common.schema";

export const CustomerSchema = z.object({
  id: cuidSchema,
  name: z.string().min(1, "Customer name is required"),
  email: z
    .email("Invalid email address")
    .or(z.literal(""))
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const CustomerCreateSchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  },
);
