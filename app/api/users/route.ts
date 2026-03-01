import { userDbService } from "@/lib/services/db/userDbService";
import { requirePermissionDBForAPI } from "@/lib/requirePermissionDB";
import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/getServerSession";

const PRIVILEGED_ROLES: Set<Role> = new Set([Role.ADMIN, Role.SUPER_ADMIN]);

function getAuthErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof Error)) return null;

  if (error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    error.message.startsWith("Forbidden:") ||
    error.message.includes("Only SUPER_ADMIN")
  ) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return null;
}

function getUniqueUserConflictResponse(error: unknown): NextResponse | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  if (error.code !== "P2002" || !error.meta?.target) {
    return null;
  }

  const targetValue = error.meta.target;
  let target = "field";
  if (Array.isArray(targetValue)) {
    target = targetValue.join(", ");
  } else if (typeof targetValue === "string") {
    target = targetValue;
  }

  return NextResponse.json(
    { error: `A user with this ${target} already exists.` },
    { status: 409 },
  );
}

export async function GET() {
  try {
    await requirePermissionDBForAPI("user:read");

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

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermissionDBForAPI("user:create");

    const data = await request.json();
    const user = await userDbService.createUser(data);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);

    const authErrorResponse = getAuthErrorResponse(error);
    if (authErrorResponse) return authErrorResponse;

    const conflictResponse = getUniqueUserConflictResponse(error);
    if (conflictResponse) return conflictResponse;

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
