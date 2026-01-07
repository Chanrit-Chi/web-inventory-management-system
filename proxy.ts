import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = new Set(["/", "/user_auth"]);

  // Define API routes that don't require authentication
  const publicApiRoutes = new Set([
    "/api/auth",
    "/api/customers",
    "/api/sales",
    "/api/products",
    "/api/suppliers",
    "/api/categories",
    "/api/reports",
  ]);

  const isPublicApiRoute = (path: string) =>
    Array.from(publicApiRoutes).some((route) => path.startsWith(route));

  const isPublicRoute = (path: string) => publicRoutes.has(path);

  if (isPublicApiRoute(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/user_auth", request.url));
    }
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Check role access
  const userRole = session.user.role;

  if (pathname.startsWith("/dashboard/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  if (
    pathname.startsWith("/dashboard/manager") &&
    !["ADMIN", "MANAGER"].includes(userRole)
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  if (
    pathname.startsWith("/dashboard/sale") &&
    !["ADMIN", "MANAGER", "SELLER"].includes(userRole)
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}
