import { z } from "zod";

// Prisma Decimal → use number at input boundary
export const moneySchema = z
  .number()
  .min(0, "Value must be non-negative")
  .default(0);

export const cuidSchema = z.string().min(10);
export const uuidSchema = z.uuid();

export const positiveInt = z.number().int().min(0, "Value must be a positive.");
