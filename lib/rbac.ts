import { Role } from "@prisma/client";

// ─── Access Levels ────────────────────────────────────────────────────────────

type AccessLevel = "none" | "read" | "write" | "admin";

const AccessActions: Record<AccessLevel, ReadonlyArray<string>> = {
  none: [],
  read: ["read"],
  write: ["create", "read", "update"],
  admin: ["create", "read", "update", "delete"],
};

// ─── CRUD Resource Matrix ─────────────────────────────────────────────────────
// To add a new feature: add ONE row here.

const ResourceMatrix = {
  user: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "read",
    SELLER: "none",
  },
  product: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "read",
  },
  category: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "read",
  },
  unit: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "read",
  },
  attribute: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "read",
  },
  stock: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "write",
  },
  sale: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "write",
  },
  invoice: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "write",
  },
  quotation: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "write",
  },
  customer: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "write",
  },
  expense: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "none",
  },
  purchase_order: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "none",
  },
  supplier: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "none",
  },
  employee: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "none",
  },
} as const satisfies Record<string, Record<Role, AccessLevel>>;

// ─── Feature Permissions (non-CRUD) ──────────────────────────────────────────
// One-off flags that don't fit the CRUD model (dashboards, tools, etc.)

export type FeaturePermission =
  | "dashboard:admin"
  | "dashboard:manager"
  | "dashboard:sale"
  | "pos:read"
  | "barcode:read"
  | "report:read"
  | "permission:admin";

const FeatureAccess: Record<Role, ReadonlyArray<FeaturePermission>> = {
  SUPER_ADMIN: [
    "dashboard:admin",
    "dashboard:manager",
    "dashboard:sale",
    "pos:read",
    "barcode:read",
    "report:read",
    "permission:admin",
  ],
  ADMIN: [
    "dashboard:admin",
    "dashboard:manager",
    "dashboard:sale",
    "pos:read",
    "barcode:read",
    "report:read",
    "permission:admin",
  ],
  MANAGER: [
    "dashboard:manager",
    "dashboard:sale",
    "pos:read",
    "barcode:read",
    "report:read",
  ],
  SELLER: ["dashboard:sale", "pos:read", "barcode:read", "report:read"],
};

// ─── Permission Types (auto-derived from matrix) ──────────────────────────────

type CrudResource = keyof typeof ResourceMatrix;
type CrudAction = "create" | "read" | "update" | "delete";
export type CrudPermission = `${CrudResource}:${CrudAction}`;
export type Permission = CrudPermission | FeaturePermission;

// ─── hasPermission ────────────────────────────────────────────────────────────

export function hasPermission(role: Role, permission: Permission): boolean {
  const colonIdx = permission.indexOf(":");
  const resource = permission.slice(0, colonIdx);
  const action = permission.slice(colonIdx + 1);

  // Check CRUD matrix
  const matrixEntry = ResourceMatrix[resource as CrudResource];
  if (matrixEntry) {
    const level: AccessLevel = matrixEntry[role];
    return (AccessActions[level] as string[]).includes(action);
  }

  // Fall back to feature permissions
  return (FeatureAccess[role] as string[]).includes(permission);
}
