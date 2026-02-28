import { z } from "zod";

export const AttributeTypeEnum = z.enum(["SELECT", "COLOR", "TEXT"]);
export type AttributeType = z.infer<typeof AttributeTypeEnum>;

// Attribute Value Schemas
export const AttributeValueCreateSchema = z.object({
  value: z.string().min(1, "Value is required"),
  displayValue: z.string().min(1, "Display value is required"),
  colorHex: z.string().optional(),
  sortOrder: z.number().int().default(0),
});

export const AttributeValueUpdateSchema = z.object({
  id: z.number().int(),
  value: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.string().min(1, "Value is required").optional(),
  ),
  displayValue: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.string().min(1, "Display value is required").optional(),
  ),
  colorHex: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.string().optional(),
  ),
  sortOrder: z.number().int().optional(),
});

export type AttributeValueCreate = z.infer<typeof AttributeValueCreateSchema>;
export type AttributeValueUpdate = z.infer<typeof AttributeValueUpdateSchema>;

// Attribute Schemas
export const AttributeCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^[a-z0-9_]+$/, "Name must be lowercase with no spaces"),
  displayName: z.string().min(1, "Display name is required"),
  type: AttributeTypeEnum.default("SELECT"),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const AttributeUpdateSchema = z.object({
  id: z.number().int(),
  name: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z
      .string()
      .min(1, "Name is required")
      .regex(/^[a-z0-9_]+$/, "Name must be lowercase with no spaces")
      .optional(),
  ),
  displayName: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.string().min(1, "Display name is required").optional(),
  ),
  type: AttributeTypeEnum.optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type AttributeCreate = z.infer<typeof AttributeCreateSchema>;
export type AttributeUpdate = z.infer<typeof AttributeUpdateSchema>;

// Response types
export interface AttributeValue {
  id: number;
  value: string;
  displayValue: string;
  colorHex: string | null;
  sortOrder: number;
  attributeId: number;
}

export interface Attribute {
  id: number;
  name: string;
  displayName: string;
  type: AttributeType;
  isRequired: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  values: AttributeValue[];
}
