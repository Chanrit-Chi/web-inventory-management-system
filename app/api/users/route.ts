import { userDbService } from "@/lib/services/db/userDbService";
import { requirePermission } from "@/lib/requirePermission";
import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/getServerSession";

const PRIVILEGED_ROLES: Set<Role> = new Set([Role.ADMIN, Role.SUPER_ADMIN]);

export async function GET() {
  try {
    await requirePermission("user:read");

    const session = await getServerSession();
    const currentUserRole = session?.user?.role as Role | undefined;

    const users = await userDbService.fetchUsers();

    // Filter: Regular ADMINs cannot see SUPER_ADMIN or other ADMIN users
    // Only SUPER_ADMIN can see all users
    const filteredUsers =
      currentUserRole === Role.SUPER_ADMIN
        ? users
        : users.filter((user) => !PRIVILEGED_ROLES.has(user.role));

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error("Error fetching users:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("user:create");

    const data = await request.json();
    const user = await userDbService.createUser(data);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002" && error.meta?.target) {
        const targetValue = error.meta.target;
        let target: string;
        if (Array.isArray(targetValue)) {
          target = targetValue.join(", ");
        } else if (typeof targetValue === "string") {
          target = targetValue;
        } else {
          target = "field";
        }
        return NextResponse.json(
          { error: `A user with this ${target} already exists.` },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
