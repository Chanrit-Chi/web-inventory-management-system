"use client";

import { useSession } from "@/lib/auth-client";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const { data: session, isPending } = useSession();
  const role = (session?.user as { role?: string })?.role || "Unknown";

  let dashboardLink: React.ReactNode = null;
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER") {
    dashboardLink = (
      <Link href="/dashboard/admin">
        <Button size="lg">Go to Dashboard</Button>
      </Link>
    );
  } else if (role === "SELLER") {
    dashboardLink = (
      <Link href="/dashboard/sale">
        <Button size="lg">Go to Dashboard</Button>
      </Link>
    );
  }

  const mainContent = session ? (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold">Welcome back, {session.user.name}!</h2>
      <p className="text-xl text-muted-foreground">
        You are successfully logged in to the Inventory Management System
      </p>
      <div className="flex justify-center gap-4">{dashboardLink}</div>
    </div>
  ) : (
    <div className="space-y-6">
      <h2 className="text-4xl font-bold">
        Welcome to Inventory Management System
      </h2>
      <p className="text-xl text-muted-foreground">
        Manage your inventory efficiently with our comprehensive solution
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/user_auth">
          <Button size="lg">Get Started</Button>
        </Link>
      </div>
    </div>
  );

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <h1 className="text-2xl font-bold">Inventory Management System</h1>
          {session ? (
            <UserNav />
          ) : (
            <Link href="/user_auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-8">
        <div className="mx-auto max-w-3xl text-center">{mainContent}</div>
      </main>
    </div>
  );
}
