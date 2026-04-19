import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PermissionCategory, Role } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Resource Matrix (from lib/rbac.ts) ──────────────────────────────────────

type AccessLevel = "none" | "read" | "write" | "admin";

const AccessActions: Record<AccessLevel, ReadonlyArray<string>> = {
  none: [],
  read: ["read"],
  write: ["create", "read", "update"],
  admin: ["create", "read", "update", "delete"],
};

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
  payment_method: {
    SUPER_ADMIN: "admin",
    ADMIN: "admin",
    MANAGER: "admin",
    SELLER: "none",
  },
} as const satisfies Record<string, Record<Role, AccessLevel>>;

type FeaturePermission =
  | "dashboard:admin"
  | "dashboard:manager"
  | "dashboard:sale"
  | "pos:read"
  | "barcode:read"
  | "export:read"
  | "import:read"
  | "permission:admin";

const FeatureAccess: Record<Role, ReadonlyArray<FeaturePermission>> = {
  SUPER_ADMIN: [
    "dashboard:admin",
    "dashboard:manager",
    "dashboard:sale",
    "pos:read",
    "barcode:read",
    "export:read",
    "import:read",
    "permission:admin",
  ],
  ADMIN: [
    "dashboard:admin",
    "dashboard:manager",
    "dashboard:sale",
    "pos:read",
    "barcode:read",
    "export:read",
    "import:read",
    "permission:admin",
  ],
  MANAGER: [
    "dashboard:manager",
    "dashboard:sale",
    "pos:read",
    "barcode:read",
    "export:read",
    "import:read",
  ],
  SELLER: ["dashboard:sale", "pos:read", "barcode:read"],
};

// ─── Seed Script ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding permission system...\n");

  // 1. Create CRUD Permissions
  console.log("📝 Creating CRUD permissions...");
  const crudPermissions: Array<{
    name: string;
    resource: string;
    action: string;
    description: string;
  }> = [];

  for (const [resource] of Object.entries(ResourceMatrix)) {
    const actions = ["create", "read", "update", "delete"];
    for (const action of actions) {
      crudPermissions.push({
        name: `${resource}:${action}`,
        resource,
        action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
      });
    }
  }

  for (const perm of crudPermissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: {
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
        category: PermissionCategory.CRUD,
      },
    });
  }
  console.log(`✅ Created ${crudPermissions.length} CRUD permissions\n`);

  // 2. Create Feature Permissions
  console.log("📝 Creating feature permissions...");
  const featurePermissions: FeaturePermission[] = [
    "dashboard:admin",
    "dashboard:manager",
    "dashboard:sale",
    "pos:read",
    "barcode:read",
    "export:read",
    "import:read",
    "permission:admin",
  ];

  const featureDescriptions: Record<FeaturePermission, string> = {
    "dashboard:admin": "Access Admin Dashboard",
    "dashboard:manager": "Access Manager Dashboard",
    "dashboard:sale": "Access Sales Dashboard",
    "pos:read": "Access Point of Sale",
    "barcode:read": "Access Barcode Generator",
    "export:read": "Export Data (XLSX/PDF)",
    "import:read": "Import Data (XLSX)",
    "permission:admin": "Manage Permissions",
  };

  for (const feature of featurePermissions) {
    const [resource, action] = feature.split(":");
    await prisma.permission.upsert({
      where: { name: feature },
      update: {},
      create: {
        name: feature,
        resource,
        action,
        description: featureDescriptions[feature],
        category: PermissionCategory.FEATURE,
      },
    });
  }
  console.log(`✅ Created ${featurePermissions.length} feature permissions\n`);

  // 3. Create Default Permission Groups (one per Role)
  console.log("👥 Creating default permission groups...");
  const roles: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SELLER"];

  const groupDescriptions: Record<Role, string> = {
    SUPER_ADMIN: "Full system access with all permissions",
    ADMIN: "Administrative access with permission management",
    MANAGER: "Management access with extended permissions",
    SELLER: "Basic sales and operational access",
  };

  const groupPriorities: Record<Role, number> = {
    SUPER_ADMIN: 100,
    ADMIN: 75,
    MANAGER: 50,
    SELLER: 25,
  };

  const createdGroups: Record<Role, string> = {} as Record<Role, string>;

  for (const role of roles) {
    const group = await prisma.permissionGroup.upsert({
      where: { name: role },
      update: {},
      create: {
        name: role,
        description: groupDescriptions[role],
        priority: groupPriorities[role],
        isDefault: true,
        baseRole: role,
      },
    });
    createdGroups[role] = group.id;
    console.log(`  ✓ Created group: ${role}`);
  }
  console.log(`✅ Created ${roles.length} permission groups\n`);

  // 4. Assign Permissions to Groups
  console.log("🔗 Assigning permissions to groups...");

  for (const role of roles) {
    const groupId = createdGroups[role];
    const permissionsToAssign: string[] = [];

    // Add CRUD permissions based on ResourceMatrix
    for (const [resource, roleAccess] of Object.entries(ResourceMatrix)) {
      const accessLevel = roleAccess[role] as AccessLevel;
      const actions = AccessActions[accessLevel];

      for (const action of actions) {
        permissionsToAssign.push(`${resource}:${action}`);
      }
    }

    // Add Feature permissions based on FeatureAccess
    const features = FeatureAccess[role];
    permissionsToAssign.push(...features);

    // Fetch permission IDs
    const permissions = await prisma.permission.findMany({
      where: { name: { in: permissionsToAssign } },
      select: { id: true, name: true },
    });

    // Create GroupPermission records
    for (const permission of permissions) {
      await prisma.groupPermission.upsert({
        where: {
          groupId_permissionId: {
            groupId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          groupId,
          permissionId: permission.id,
        },
      });
    }

    console.log(`  ✓ ${role}: ${permissions.length} permissions`);
  }

  console.log(`✅ Assigned permissions to all groups\n`);

  // 5. Summary
  const totalPermissions = await prisma.permission.count();
  const totalGroups = await prisma.permissionGroup.count();
  const totalGroupPermissions = await prisma.groupPermission.count();

  console.log("📊 Summary:");
  console.log(`   Permissions: ${totalPermissions}`);
  console.log(`   Groups: ${totalGroups}`);
  console.log(`   Group-Permission Links: ${totalGroupPermissions}`);
  console.log("\n✨ Permission system seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding permissions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
