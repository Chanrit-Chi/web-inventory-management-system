import { z } from "zod";
import { cuidSchema } from "./common.schema";

export const SupplierSchema = z.object({
  id: cuidSchema,
  name: z.string().min(1, "Supplier name is required"),
  email: z.email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const SupplierCreateSchema = SupplierSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const SupplierUpdateSchema = SupplierCreateSchema.partial();
