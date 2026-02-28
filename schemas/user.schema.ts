import { z } from "zod";
import { Role } from "@prisma/client";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  emailVerified: z.boolean().default(false),
  role: z.enum(Role).default(Role.SELLER),
  image: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  deactivatedBy: z.string().nullable().optional(),
  deactivatedAt: z.date().nullable().optional(),
});

export const UserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  role: z.enum(Role).default(Role.SELLER),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  image: z.string().nullable().optional(),
});

export const UserUpdateSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.email("Invalid email address").optional(),
    role: z.enum(Role).optional(),
    image: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
