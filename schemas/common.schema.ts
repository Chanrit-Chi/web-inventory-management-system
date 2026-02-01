import { z } from "zod";
import Decimal from "decimal.js";

// Prisma Decimal → maintain precision with Decimal.js
export const moneySchema = z
  .union([z.number(), z.string(), z.instanceof(Decimal)])
  .refine((val) => {
    try {
      const dec = val instanceof Decimal ? val : new Decimal(val);
      return dec.isFinite() && dec.greaterThanOrEqualTo(0);
    } catch {
      return false;
    }
  }, "Value must be a valid non-negative number")
  .transform((val) => (val instanceof Decimal ? val : new Decimal(val)))
  .default(new Decimal(0));

export const cuidSchema = z.string().min(10);
export const uuidSchema = z.uuid();

export const positiveInt = z.number().int().min(0, "Value must be a positive.");
